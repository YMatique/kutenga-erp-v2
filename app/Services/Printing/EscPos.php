<?php

namespace App\Services\Printing;

/**
 * Construtor mínimo de comandos ESC/POS (impressoras térmicas Epson-compatíveis).
 * Os textos são convertidos para CP850 (acentos portugueses), seleccionada com ESC t 2.
 */
class EscPos
{
    private string $buffer = '';

    /** Caracteres por linha: 48 em 80mm, 32 em 58mm (fonte A). */
    public function __construct(private int $paperWidthMm = 80)
    {
        $this->buffer = "\x1B@"      // inicializar
            . "\x1Bt\x02";            // tabela de caracteres CP850
    }

    public function columns(): int
    {
        return $this->paperWidthMm === 58 ? 32 : 48;
    }

    public function align(string $align): self
    {
        $n = ['left' => 0, 'center' => 1, 'right' => 2][$align] ?? 0;
        $this->buffer .= "\x1Ba" . chr($n);

        return $this;
    }

    public function bold(bool $on = true): self
    {
        $this->buffer .= "\x1BE" . chr($on ? 1 : 0);

        return $this;
    }

    /** Tamanho: 1 = normal, 2 = dupla altura e largura. */
    public function size(int $size = 1): self
    {
        $this->buffer .= "\x1D!" . chr($size >= 2 ? 0x11 : 0x00);

        return $this;
    }

    public function text(string $text): self
    {
        $this->buffer .= $this->encode($text);

        return $this;
    }

    public function line(string $text = ''): self
    {
        return $this->text($text . "\n");
    }

    public function centered(string $text, bool $bold = false, int $size = 1): self
    {
        return $this->align('center')->bold($bold)->size($size)->line($text)
            ->size(1)->bold(false)->align('left');
    }

    public function separator(string $char = '-'): self
    {
        return $this->line(str_repeat($char, $this->columns()));
    }

    /** Linha com texto à esquerda e valor à direita. */
    public function pair(string $left, string $right): self
    {
        $width = $this->columns();
        $space = $width - mb_strlen($left) - mb_strlen($right);

        if ($space < 1) {
            $left = mb_substr($left, 0, max(0, $width - mb_strlen($right) - 1));
            $space = $width - mb_strlen($left) - mb_strlen($right);
        }

        return $this->line($left . str_repeat(' ', $space) . $right);
    }

    public function feed(int $lines = 1): self
    {
        $this->buffer .= str_repeat("\n", $lines);

        return $this;
    }

    /** Avança o papel e corta (corte parcial). */
    public function cut(): self
    {
        $this->buffer .= str_repeat("\n", 3) . "\x1DV\x42\x00";

        return $this;
    }

    /** Pulso para abrir a gaveta de dinheiro (pino 2). */
    public function openDrawer(): self
    {
        $this->buffer .= "\x1Bp\x00\x19\xFA";

        return $this;
    }

    public function bytes(): string
    {
        return $this->buffer;
    }

    public function base64(): string
    {
        return base64_encode($this->buffer);
    }

    /** Mantém os acentos suportados pela CP850; o resto cai para ASCII. */
    private function encode(string $text): string
    {
        return mb_convert_encoding($text, 'CP850', 'UTF-8');
    }
}
