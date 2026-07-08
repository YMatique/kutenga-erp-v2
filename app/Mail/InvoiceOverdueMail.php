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

class InvoiceOverdueMail extends Mailable implements ShouldQueue
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
        return new Envelope(
            subject: "AVISO: Pagamento em Atraso - Fatura " . ($this->document->document_number ?? 'Rascunho'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice_overdue',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $this->document->loadMissing(['items', 'series', 'customer', 'company']);

        // Gerar PDF em buffer
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.document', ['document' => $this->document]);
        $pdf->setPaper('a4', 'portrait');
        $pdfContent = $pdf->output();

        $name = $this->document->document_number ?: "FT_overdue_{$this->document->id}";
        $filename = str_replace(['/', ' '], '_', $name) . '.pdf';

        return [
            Attachment::fromData(fn () => $pdfContent, $filename)
                ->withMime('application/pdf'),
        ];
    }
}
