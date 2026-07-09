<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$files = glob(app_path('Models/*.php'));
foreach($files as $f) {
    $c = file_get_contents($f);
    if(strpos($c, 'HasAudit') !== false) {
        $c = str_replace('use App\Traits\HasAudit;', '// use App\Traits\HasAudit;', $c);
        $c = str_replace(', HasAudit', ' /* , HasAudit */', $c);
        $c = str_replace(' HasAudit,', ' /* HasAudit, */', $c);
        file_put_contents($f, $c);
        echo "Updated " . basename($f) . "\n";
    }
}
echo "Done.\n";
