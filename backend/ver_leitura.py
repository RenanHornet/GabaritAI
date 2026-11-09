"""
Mostra em tempo real o que o worker enxerga na webcam.

Não usa banco nem Docker: chama direto o leitor do worker (omr_engine).

Para executar (dentro da pasta backend):
    pip install "opencv-python>=4.9,<5"
    python ver_leitura.py        # webcam padrão
    python ver_leitura.py 1      # outra webcam

Tecla Q fecha a janela.
"""

import sys
import time

import cv2
import numpy as np

from app.worker.vision.omr_engine import (
    OPTIONS,
    PAGE_H,
    PAGE_W,
    SAMPLE_RADIUS,
    bubble_center,
    find_markers,
    read_bubbles,
    rectify_page,
)

# Tamanho da janela: câmera e resumo à esquerda, cartão à direita.
ALTURA = 720
LARGURA_ESQUERDA = 640

# Cores em BGR (o OpenCV usa azul, verde, vermelho).
VERDE = (0, 180, 0)
LARANJA = (0, 140, 255)
CINZA = (170, 170, 170)
VERMELHO = (0, 0, 220)
BRANCO = (255, 255, 255)

DUVIDA = ("MULTIPLE", "UNCERTAIN")


def escrever(imagem, texto, x, y, cor=BRANCO, tamanho=0.6):
    cv2.putText(imagem, texto, (x, y), cv2.FONT_HERSHEY_SIMPLEX, tamanho, cor, 1, cv2.LINE_AA)


def desenhar_bolhas(cartao, leituras):
    """Desenha no cartão a área medida em cada bolha e o percentual pintado."""
    for item in leituras:
        for indice, letra in enumerate(OPTIONS):
            preenchimento = item["fill_ratios"][letra]

            if item["answer"] == letra:
                cor, espessura = VERDE, 3
            elif item["status"] in DUVIDA and preenchimento >= 0.15:
                cor, espessura = LARANJA, 3
            else:
                cor, espessura = CINZA, 1

            x, y = bubble_center(item["question"], indice)
            cv2.circle(cartao, (x, y), SAMPLE_RADIUS, cor, espessura)

            if preenchimento >= 0.15:
                escrever(cartao, f"{preenchimento:.0%}", x - 20, y - 20, VERMELHO, 0.55)


def desenhar_camera(frame, cantos):
    """Reduz a imagem da câmera e marca os quatro quadrados encontrados."""
    camera = frame.copy()

    if cantos is not None:
        pontos = cantos.astype(np.int32)
        cv2.polylines(camera, [pontos], True, VERDE, 3)
        for x, y in pontos:
            cv2.circle(camera, (int(x), int(y)), 12, VERMELHO, -1)

    altura = camera.shape[0] * LARGURA_ESQUERDA // camera.shape[1]
    return cv2.resize(camera, (LARGURA_ESQUERDA, min(altura, ALTURA - 200)))


def desenhar_resumo(largura, altura, leituras, erro, fps):
    """Monta o texto abaixo da câmera."""
    resumo = np.zeros((altura, largura, 3), dtype=np.uint8)
    escrever(resumo, f"FPS: {fps:.1f}", 15, 28, CINZA)

    if erro:
        escrever(resumo, "CARTAO NAO ENCONTRADO", 15, 62, VERMELHO, 0.7)
        escrever(resumo, "Mostre os quatro quadrados pretos.", 15, 92, CINZA)
        return resumo

    contar = lambda *status: sum(item["status"] in status for item in leituras)
    duvidas = [str(item["question"]) for item in leituras if item["status"] in DUVIDA]

    escrever(resumo, f"Marcadas: {contar('ANSWERED')}", 15, 62, VERDE, 0.7)
    escrever(resumo, f"Em branco: {contar('BLANK')}", 15, 92, CINZA, 0.7)
    escrever(resumo, f"Duvida: {contar(*DUVIDA)}  {' '.join(duvidas)[:45]}", 15, 122, LARANJA, 0.7)
    return resumo


def montar_painel(frame, fps=0.0, cartao_anterior=None):
    """Lê um frame e devolve (painel para exibir, cartão desenhado)."""
    cantos, leituras, erro = None, [], None

    try:
        cantos = find_markers(frame)
        cartao = rectify_page(frame)
        leituras = read_bubbles(cartao)
        desenhar_bolhas(cartao, leituras)
    except ValueError as excecao:
        erro = str(excecao)
        cartao = cartao_anterior

    if cartao is None:
        cartao = np.full((PAGE_H, PAGE_W, 3), 40, dtype=np.uint8)

    camera = desenhar_camera(frame, cantos)
    resumo = desenhar_resumo(LARGURA_ESQUERDA, ALTURA - camera.shape[0], leituras, erro, fps)
    esquerda = np.vstack([camera, resumo])

    largura_cartao = PAGE_W * ALTURA // PAGE_H
    direita = cv2.resize(cartao, (largura_cartao, ALTURA), interpolation=cv2.INTER_AREA)
    return np.hstack([esquerda, direita]), cartao


def main():
    indice_camera = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    camera = cv2.VideoCapture(indice_camera)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    if not camera.isOpened():
        print("Não consegui abrir a webcam. Verifique a permissão de câmera do terminal.")
        return

    cartao, fps, inicio = None, 0.0, time.time()

    while True:
        ok, frame = camera.read()
        if not ok:
            print("A webcam parou de enviar imagens.")
            break

        painel, cartao = montar_painel(frame, fps, cartao)
        cv2.imshow("GabaritAI - leitura ao vivo (Q para sair)", painel)

        agora = time.time()
        fps, inicio = 1 / max(agora - inicio, 0.001), agora

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
