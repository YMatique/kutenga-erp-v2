<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

$role = Role::where('name', 'Admin')->first();
if ($role) {
    $role->givePermissionTo('audits.view');
    echo "Permission given to Admin.\n";
} else {
    echo "Admin role not found.\n";
}
