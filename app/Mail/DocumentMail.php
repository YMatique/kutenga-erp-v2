<?php

namespace App\Mail;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentMail extends Mailable
{
    use Queueable, SerializesModels;

    public Document $document;
    protected string $pdfContent;
    protected string $filename;

    /**
     * Create a new message instance.
     */
    public function __construct(Document $document, string $pdfContent, string $filename)
    {
        $this->document = $document;
        $this->pdfContent = $pdfContent;
        $this->filename = $filename;
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
        return [
            Attachment::fromData(fn () => $this->pdfContent, $this->filename)
                ->withMime('application/pdf'),
        ];
    }
}
