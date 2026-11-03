<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedUser extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'blocked_user_id',
    ];

    // Usuario que bloquea
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Usuario bloqueado
    public function blockedUser()
    {
        return $this->belongsTo(User::class, 'blocked_user_id');
    }
}
