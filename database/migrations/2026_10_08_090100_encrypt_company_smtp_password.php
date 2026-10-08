<?php

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A palavra-passe SMTP passa a ser guardada cifrada (cast `encrypted` em Company).
     * O valor cifrado é bastante maior que 255 caracteres, daí a coluna passar a text.
     */
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->text('smtp_password')->nullable()->change();
        });

        DB::table('companies')->whereNotNull('smtp_password')->get(['id', 'smtp_password'])->each(function ($company) {
            try {
                Crypt::decryptString($company->smtp_password);

                return; // já cifrada
            } catch (DecryptException) {
                DB::table('companies')->where('id', $company->id)->update([
                    'smtp_password' => Crypt::encryptString($company->smtp_password),
                ]);
            }
        });
    }

    public function down(): void
    {
        DB::table('companies')->whereNotNull('smtp_password')->get(['id', 'smtp_password'])->each(function ($company) {
            try {
                DB::table('companies')->where('id', $company->id)->update([
                    'smtp_password' => Crypt::decryptString($company->smtp_password),
                ]);
            } catch (DecryptException) {
                // já em texto simples
            }
        });
    }
};
