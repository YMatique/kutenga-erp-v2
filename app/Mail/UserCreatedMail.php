<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public string $setPasswordUrl;

    /**
     * A palavra-passe nunca viaja por e-mail (nem fica no payload da fila):
     * o utilizador define a sua através de uma ligação de recuperação.
     */
    public function __construct(User $user, string $setPasswordUrl)
    {
        $this->user = $user->loadMissing('company');
        $this->setPasswordUrl = $setPasswordUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = $this->user->company->name ?? config('app.name', 'Kutenga');
        $subject = "{$companyName} - A tua conta de utilizador foi criada";

        return new Envelope(
            from: new Address(
                $this->user->company->email ?? config('mail.from.address'),
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
            view: 'emails.user_created',
        );
    }
}
