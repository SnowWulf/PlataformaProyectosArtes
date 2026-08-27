<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendTwoFactorCode extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Tu código de verificación - Plataforma Artes')
            ->greeting('Hola, ' . $notifiable->name)
            ->line('Has solicitado iniciar sesión. Tu código de verificación en 2 pasos es:')
            ->line('*** ' . $notifiable->two_factor_code . ' ***')
            ->line('Este código expirará en exactamente 2 minutos.')
            ->line('Si no solicitaste este código, puedes ignorar este mensaje.');
    }
}