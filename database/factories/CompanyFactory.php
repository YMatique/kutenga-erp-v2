<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Empresa completa (NUIT, morada e telefone preenchidos): é o estado de uma empresa que já
 * terminou o onboarding. Use `incomplete()` para a que ainda tem de o fazer.
 *
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'nuit' => (string) fake()->unique()->numerify('4########'),
            'email' => fake()->unique()->companyEmail(),
            'phone' => '+25884'.fake()->numerify('#######'),
            'address' => fake()->streetAddress().', Maputo',
            'default_currency' => 'MZN',
            'status' => 'active',
        ];
    }

    /** Empresa que ainda não concluiu o onboarding. */
    public function incomplete(): static
    {
        return $this->state(fn () => ['nuit' => null, 'address' => null, 'phone' => null]);
    }
}
