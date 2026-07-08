<?php

namespace App\Mail;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Document $document;

    /**
     * Create a new message instance.
     */
    public function __construct(Document $document)
    {
        $this->document = $document;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $typeLabels = [
            'FT' => 'Fatura',
            'FR' => 'Fatura-Recibo',
            'CT' => 'Cotação',
            'NC' => 'Nota de Crédito',
            'ND' => 'Nota de Débito',
            'GR' => 'Guia de Remessa',
        ];
        
        $label = $typeLabels[$this->document->document_type] ?? 'Documento';
        $subject = "Kutenga ERP - " . $label . " " . ($this->document->document_number ?? 'Rascunho');

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.document',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        // Carregar relações necessárias caso tenham sido serializadas sem elas
        $this->document->loadMissing(['items', 'series', 'customer', 'company']);

        // Gerar PDF em buffer na memória do worker
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.document', ['document' => $this->document]);
        $pdf->setPaper('a4', 'portrait');
        $pdfContent = $pdf->output();

        // Nome do ficheiro em anexo
        $name = $this->document->document_number ?: "{$this->document->document_type}_draft_{$this->document->id}";
        $filename = str_replace(['/', ' '], '_', $name) . '.pdf';

        return [
            Attachment::fromData(fn () => $pdfContent, $filename)
                ->withMime('application/pdf'),
        ];
    }
}
