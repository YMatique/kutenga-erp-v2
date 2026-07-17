<?php

namespace App\Mail;

use App\Models\Billing\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Address;
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
        $this->document = $document->loadMissing(['company', 'customer']);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = $this->document->company->name ?? config('app.name', 'Kutenga');
        $subject = "{$companyName} - AVISO: Fatura " . ($this->document->document_number ?? 'Rascunho') . " em atraso";

        return new Envelope(
            from: new Address(
                $this->document->company->email ?: config('mail.from.address'),
                $companyName
            ),
            subject: $subject,
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
