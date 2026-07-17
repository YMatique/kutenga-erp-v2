<?php

namespace App\Mail;

use App\Models\Catalog\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowStockAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Product $product;
    public float $stock;

    /**
     * Create a new message instance.
     */
    public function __construct(Product $product, float $stock)
    {
        $this->product = $product->loadMissing('company');
        $this->stock = $stock;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = $this->product->company->name ?? config('app.name', 'Kutenga');
        $subject = "{$companyName} - Alerta de Stock: {$this->product->name} atingiu o limite mínimo";

        return new Envelope(
            from: new Address(
                $this->product->company->email ?? config('mail.from.address'),
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
            view: 'emails.low_stock',
        );
    }
}
