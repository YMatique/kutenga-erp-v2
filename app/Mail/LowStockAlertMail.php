<?php

namespace App\Mail;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
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
        $this->product = $product;
        $this->stock = $stock;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Alerta de Stock: {$this->product->name} atingiu o limite mínimo",
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
