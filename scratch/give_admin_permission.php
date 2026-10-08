<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Spatie\Permission\Models\Role;

$role = Role::where('name', 'Admin')->first();
if ($role) {
    $role->givePermissionTo('audits.view');
    echo "Permission given to Admin.\n";
} else {
    echo "Admin role not found.\n";
}
