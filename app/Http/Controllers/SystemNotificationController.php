<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use Illuminate\Http\Request;

class SystemNotificationController extends Controller
{
    public function markAsRead(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $notification = SystemNotification::where('company_id', $companyId)->findOrFail($id);

        $notification->update(['is_read' => true]);

        return redirect()->back();
    }
}
