<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemNotificationController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        $filter = $request->query('filter', 'all');

        $query = SystemNotification::where('company_id', $companyId)
            ->orderBy('created_at', 'desc');

        if ($filter === 'unread') {
            $query->where('is_read', false);
        } elseif ($filter === 'read') {
            $query->where('is_read', true);
        }

        $notifications = $query->paginate(15)->withQueryString();

        return Inertia::render('notifications/Index', [
            'notifications' => $notifications,
            'filter' => $filter,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $notification = SystemNotification::where('company_id', $companyId)->findOrFail($id);

        $notification->update(['is_read' => true]);

        return redirect()->back();
    }

    public function markAllAsRead(Request $request)
    {
        $companyId = $request->user()->company_id;
        SystemNotification::where('company_id', $companyId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return redirect()->back()->with('success', 'Todas as notificações foram marcadas como lidas.');
    }
}
