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
MIN_TITLE_INK = 0.15  # abaixo disso, o título não está onde deveria
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
    return best_page


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
        elif second >= MIN_FILL_RATIO and best - second < MIN_WINNER_MARGIN:
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


def save_debug_image(page: np.ndarray, readings: list[dict[str, Any]], output: Path) -> None:
    """Salva o cartão com um círculo em cada bolha, para conferir o alinhamento."""
    debug = page.copy()
    for item in readings:
        for index, option in enumerate(OPTIONS):
            marked = item["answer"] == option
            color = (0, 180, 0) if marked else (0, 140, 255)
            cv2.circle(debug, bubble_center(item["question"], index), 19, color, 2)
    output.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output), debug)


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
