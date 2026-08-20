<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;


class RegistrationStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $asunto;
    public string $mensaje;

    /**
     * Recibe el asunto del correo y el mensaje que redactó el administrador en Angular.
     */
    public function __construct(string $asunto, string $mensaje)
    {
        $this->asunto = $asunto;
        $this->mensaje = $mensaje;
    }

    /**
     * Construye el correo.
     */
    public function build()
    {
        return $this->subject($this->asunto)
                    ->html("
                        <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                            <h2 style='color: #2563eb;'>{$this->asunto}</h2>
                            <p style='white-space: pre-wrap; line-height: 1.6; font-size: 15px;'>{$this->mensaje}</p>
                            <hr style='border: none; border-top: 1px solid #ddd; margin-top: 20px;'>
                            <small style='color: #888;'>Este es un correo automático generado por el sistema de gestión.</small>
                        </div>
                    ");
    }
}