"""
Leitor do cartão-resposta GabaritAI (40 questões, alternativas A-E).

Passos:
  1) acha os quatro quadrados pretos dos cantos;
  2) "desentorta" a foto para o tamanho do cartão modelo;
  3) mede quanto cada bolha está preenchida;
  4) devolve a alternativa marcada em cada questão.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np

# Medidas em pixels do cartão modelo (imagem de 1684 x 1191).
PAGE_W, PAGE_H = 1684, 1191
MARKERS = np.array(
    [[36, 36], [1647, 36], [1647, 1154], [36, 1154]], dtype=np.float32
)  # topo-esquerda, topo-direita, baixo-direita, baixo-esquerda
TITLE_BOX = (80, 65, 257, 95)  # área do texto "GABARITAI"
MIN_TITLE_INK = 0.05  # abaixo disso, o título não está onde deveria (na webcam as letras ficam finas)
MIN_DETECTION_SIZE = 2600  # maior lado da imagem ao procurar os quadrados

QUESTIONS = 40
QUESTIONS_PER_COLUMN = 10
OPTIONS = "ABCDE"

COLUMN_FIRST_X = [188.8, 568.5, 948.3, 1328.7]  # centro da bolha A de cada coluna
OPTION_STEP_X = 45.3  # distância entre as bolhas A, B, C...
FIRST_ROW_Y = 373.5  # centro da primeira linha
ROW_STEP_Y = 61.8  # distância entre as linhas
SAMPLE_RADIUS = 11  # mede só o miolo da bolha, sem o contorno impresso

# Limites de preenchimento (0 = vazia, 1 = cheia). Ajuste com cartões reais.
MIN_FILL_RATIO = 0.30
MIN_WINNER_MARGIN = 0.15

# Reconhecimento dos círculos impressos, usados para corrigir a curvatura da lente.
MIN_BUBBLE_AREA, MAX_BUBBLE_AREA = 500, 2600
MIN_BUBBLE_ROUNDNESS = 0.6
GRID_TOLERANCE = 75  # quanto um círculo pode estar fora do lugar esperado
MIN_BUBBLES_TO_ALIGN = 120  # de 200; com menos, não dá para confiar no ajuste
MAX_ALIGN_ERROR = 12  # distância máxima, em pixels, para um ponto valer no ajuste
SAME_LINE_DISTANCE = 30  # círculos a essa distância estão na mesma fileira


def bubble_center(question: int, option_index: int) -> tuple[int, int]:
    """Retorna o centro (x, y) de uma bolha no cartão modelo."""
    column = (question - 1) // QUESTIONS_PER_COLUMN
    row = (question - 1) % QUESTIONS_PER_COLUMN
    x = COLUMN_FIRST_X[column] + option_index * OPTION_STEP_X
    y = FIRST_ROW_Y + row * ROW_STEP_Y
    return round(x), round(y)


def find_markers(image: np.ndarray) -> np.ndarray:
    """Acha os quatro quadrados pretos e devolve os centros em ordem horária."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Na webcam os quadrados saem pequenos; ampliar deixa o contorno mais nítido.
    zoom = max(1.0, MIN_DETECTION_SIZE / max(gray.shape))
    gray = cv2.resize(gray, None, fx=zoom, fy=zoom, interpolation=cv2.INTER_CUBIC)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    height, width = gray.shape
    # Janela grande e proporcional à foto: aguenta sombra e não "fura" o quadrado.
    window = max(max(width, height) // 8 | 1, 3)
    binary = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, window, 40
    )
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    centers, areas = [], []
    for contour in contours:
        area = cv2.contourArea(contour)
        if not (width * height * 0.000015 <= area <= width * height * 0.025):
            continue
        perimeter = cv2.arcLength(contour, True)
        polygon = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
        if len(polygon) != 4 or not cv2.isContourConvex(polygon):
            continue
        _, _, box_w, box_h = cv2.boundingRect(polygon)
        if 0.6 <= box_w / box_h <= 1.6 and area / (box_w * box_h) >= 0.55:
            moments = cv2.moments(contour)
            centers.append(
                (moments["m10"] / moments["m00"], moments["m01"] / moments["m00"])
            )
            areas.append(area)

    missing_corners = ValueError(
        "Não encontrei os quatro quadrados pretos. "
        "Tire a foto mostrando os quatro cantos do cartão."
    )
    if len(centers) < 4:
        raise missing_corners

    points = np.array(centers, dtype=np.float32)
    total, difference = points.sum(axis=1), points[:, 0] - points[:, 1]
    chosen = [
        int(np.argmin(total)),
        int(np.argmax(difference)),
        int(np.argmax(total)),
        int(np.argmin(difference)),
    ]
    # Os quatro cantos são distintos e têm tamanhos parecidos.
    chosen_areas = [areas[i] for i in chosen]
    if len(set(chosen)) < 4 or max(chosen_areas) > 2.5 * min(chosen_areas):
        raise missing_corners
    return points[chosen] / zoom


def rectify_page(image: np.ndarray) -> np.ndarray:
    """Alinha a foto ao cartão modelo, em qualquer rotação."""
    corners = find_markers(image)
    x1, y1, x2, y2 = TITLE_BOX
    best_page, best_ink = None, -1.0

    # Testa as 4 rotações: a correta é a que tem o título no lugar certo.
    for shift in range(4):
        matrix = cv2.getPerspectiveTransform(np.roll(corners, shift, axis=0), MARKERS)
        page = cv2.warpPerspective(
            image, matrix, (PAGE_W, PAGE_H), borderValue=(255, 255, 255)
        )
        title = cv2.cvtColor(page[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY)
        ink = float(np.mean(title < 128))
        if ink > best_ink:
            best_page, best_ink = page, ink

    if best_ink < MIN_TITLE_INK:
        raise ValueError(
            "Não reconheci o cartão. Tire outra foto com os quatro cantos visíveis."
        )
    return align_to_printed_bubbles(best_page)


def find_printed_bubbles(page: np.ndarray) -> np.ndarray:
    """Devolve o centro (x, y) de cada círculo impresso encontrado no cartão."""
    gray = cv2.cvtColor(page, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 151, 15
    )
    # Olha só a área das questões: uma borda escura em volta da página
    # viraria um contorno único e esconderia todos os círculos.
    # A folga passa da tolerância para não cortar círculos ao meio.
    margin = GRID_TOLERANCE + 40
    left = int(COLUMN_FIRST_X[0] - margin)
    right = int(COLUMN_FIRST_X[-1] + 4 * OPTION_STEP_X + margin)
    top = int(FIRST_ROW_Y - margin)
    bottom = int(FIRST_ROW_Y + (QUESTIONS_PER_COLUMN - 1) * ROW_STEP_Y + margin)
    area_of_interest = np.zeros_like(binary)
    area_of_interest[top:bottom, left:right] = binary[top:bottom, left:right]
    contours, _ = cv2.findContours(
        area_of_interest, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    centers = []
    for contour in contours:
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        if not (MIN_BUBBLE_AREA <= area <= MAX_BUBBLE_AREA):
            continue
        if 4 * np.pi * area / (perimeter * perimeter) < MIN_BUBBLE_ROUNDNESS:
            continue
        moments = cv2.moments(contour)
        centers.append((moments["m10"] / moments["m00"], moments["m01"] / moments["m00"]))
    return np.array(centers, dtype=np.float64).reshape(-1, 2)


def match_bubbles_to_grid(found: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Descobre de qual posição do modelo é cada círculo encontrado."""
    expected, matched = [], []
    x_step, y_step = OPTION_STEP_X, ROW_STEP_Y

    for column, first_x in enumerate(COLUMN_FIRST_X):
        # Só vale o que está perto do bloco: ignora rabiscos fora das questões.
        left, right = first_x - GRID_TOLERANCE, first_x + 4 * x_step + GRID_TOLERANCE
        top = FIRST_ROW_Y - GRID_TOLERANCE
        bottom = FIRST_ROW_Y + (QUESTIONS_PER_COLUMN - 1) * y_step + GRID_TOLERANCE
        block = found[
            (found[:, 0] >= left) & (found[:, 0] <= right)
            & (found[:, 1] >= top) & (found[:, 1] <= bottom)
        ]
        # Bolha de verdade tem vizinhas alinhadas; cursor ou número solto não tem.
        same_column = np.abs(block[:, 0, None] - block[:, 0]) < SAME_LINE_DISTANCE
        same_row = np.abs(block[:, 1, None] - block[:, 1]) < SAME_LINE_DISTANCE
        block = block[(same_column.sum(axis=1) >= 4) & (same_row.sum(axis=1) >= 3)]
        if len(block) < 2:
            continue

        # A posição dentro do bloco diz a alternativa e a linha da bolha.
        low, span = block.min(axis=0), np.ptp(block, axis=0)
        if span[0] == 0 or span[1] == 0:
            continue
        options = np.rint((block[:, 0] - low[0]) / span[0] * 4)
        rows = np.rint((block[:, 1] - low[1]) / span[1] * (QUESTIONS_PER_COLUMN - 1))

        for point, option, row in zip(block, options, rows):
            expected.append((first_x + option * x_step, FIRST_ROW_Y + row * y_step))
            matched.append(point)

    return np.array(expected).reshape(-1, 2), np.array(matched).reshape(-1, 2)


def curve_terms(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Termos da curva que descreve a deformação causada pela lente."""
    x, y = x / PAGE_W, y / PAGE_H
    return np.stack(
        [np.ones_like(x), x, y, x * x, x * y, y * y, x**3, x * x * y, x * y * y, y**3],
        axis=-1,
    )


def align_to_printed_bubbles(page: np.ndarray) -> np.ndarray:
    """
    Corrige a curvatura da lente usando os círculos impressos como referência.

    Os quatro cantos alinham só as bordas; no meio do cartão a webcam ainda
    desloca as bolhas. Sem alinhar, a leitura sairia errada: por isso recusa a foto.
    """
    cannot_align = ValueError(
        "Não consegui alinhar as bolhas do cartão. Tire outra foto, mais de frente."
    )
    expected, matched = match_bubbles_to_grid(find_printed_bubbles(page))
    if len(expected) < MIN_BUBBLES_TO_ALIGN:
        raise cannot_align

    terms = curve_terms(expected[:, 0], expected[:, 1])
    curve = np.linalg.lstsq(terms, matched, rcond=None)[0]

    # Refaz o ajuste sem os pontos que ficaram longe (rabiscos e bolhas borradas).
    errors = np.linalg.norm(terms @ curve - matched, axis=1)
    good = errors <= MAX_ALIGN_ERROR
    if good.sum() < MIN_BUBBLES_TO_ALIGN:
        raise cannot_align
    curve = np.linalg.lstsq(terms[good], matched[good], rcond=None)[0]

    # A curva é suave: calcular em 1/4 do tamanho e ampliar é suficiente.
    small_x, small_y = np.meshgrid(
        np.linspace(0, PAGE_W - 1, PAGE_W // 4), np.linspace(0, PAGE_H - 1, PAGE_H // 4)
    )
    source = curve_terms(small_x, small_y) @ curve
    map_x = cv2.resize(source[..., 0].astype(np.float32), (PAGE_W, PAGE_H))
    map_y = cv2.resize(source[..., 1].astype(np.float32), (PAGE_W, PAGE_H))
    return cv2.remap(
        page, map_x, map_y, cv2.INTER_LINEAR, borderValue=(255, 255, 255)
    )


def read_bubbles(page: np.ndarray) -> list[dict[str, Any]]:
    """Mede as bolhas e classifica cada questão."""
    gray = cv2.cvtColor(page, cv2.COLOR_BGR2GRAY)
    # A janela (151) é bem maior que a bolha, senão o miolo pintado some.
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 151, 25
    )
    size = SAMPLE_RADIUS * 2 + 1
    disc = np.zeros((size, size), dtype=np.uint8)
    cv2.circle(disc, (SAMPLE_RADIUS, SAMPLE_RADIUS), SAMPLE_RADIUS, 255, -1)
    disc_area = cv2.countNonZero(disc)

    results = []
    for question in range(1, QUESTIONS + 1):
        fills = {}
        for index, option in enumerate(OPTIONS):
            x, y = bubble_center(question, index)
            patch = binary[
                y - SAMPLE_RADIUS : y + SAMPLE_RADIUS + 1,
                x - SAMPLE_RADIUS : x + SAMPLE_RADIUS + 1,
            ]
            fills[option] = cv2.countNonZero(cv2.bitwise_and(patch, disc)) / disc_area

        ranked = sorted(fills.items(), key=lambda item: item[1], reverse=True)
        (winner, best), (_, second) = ranked[0], ranked[1]

        if best < MIN_FILL_RATIO:
            status, answer = "BLANK", None
        elif second >= MIN_FILL_RATIO:
            # Mais de uma bolha pintada: a questão é anulada.
            status, answer = "MULTIPLE", None
        elif best - second < MIN_WINNER_MARGIN:
            status, answer = "UNCERTAIN", None
        else:
            status, answer = "ANSWERED", winner

        results.append({
            "question": question,
            "answer": answer,
            "status": status,
            "fill_ratios": {k: round(v, 3) for k, v in fills.items()},
        })
    return results


def draw_readings(page: np.ndarray, readings: list[dict[str, Any]]) -> np.ndarray:
    """Devolve o cartão com a área medida em cada bolha e o que foi lido nela."""
    drawing = page.copy()
    for item in readings:
        for index, option in enumerate(OPTIONS):
            fill = item["fill_ratios"][option]
            center = bubble_center(item["question"], index)

            if item["answer"] == option:
                color, thickness = (0, 180, 0), 3  # verde: resposta lida
            elif item["status"] == "MULTIPLE" and fill >= MIN_FILL_RATIO:
                color, thickness = (0, 0, 220), 3  # vermelho: anulada
            elif item["status"] == "UNCERTAIN" and fill >= MIN_WINNER_MARGIN:
                color, thickness = (0, 140, 255), 3  # laranja: dúvida
            else:
                color, thickness = (170, 170, 170), 1  # cinza: vazia

            cv2.circle(drawing, center, SAMPLE_RADIUS, color, thickness)
            if fill >= MIN_WINNER_MARGIN:
                cv2.putText(
                    drawing, f"{fill:.0%}", (center[0] - 20, center[1] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 220), 1, cv2.LINE_AA,
                )
    return drawing


def save_debug_image(page: np.ndarray, readings: list[dict[str, Any]], output: Path) -> None:
    """Salva o cartão desenhado, para conferir o alinhamento."""
    output.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output), draw_readings(page, readings))


def process_image(image_path: Path, debug_dir: Path | None = None) -> dict[str, Any]:
    """Lê uma foto do cartão e devolve as respostas encontradas."""
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError("Não foi possível abrir a imagem enviada.")

    page = rectify_page(image)
    readings = read_bubbles(page)

    if debug_dir:
        save_debug_image(page, readings, debug_dir / "alinhamento.png")

    return {"answers": readings}
