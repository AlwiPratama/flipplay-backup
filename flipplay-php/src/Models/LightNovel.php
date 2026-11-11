<?php

declare(strict_types=1);

namespace FlipPlay\Models;

class LightNovel extends Media
{
    private int $volumes;

    public function __construct(
        int $id,
        string $title,
        array $genres,
        float $rating,
        int $year,
        string $status,
        string $summary,
        int $volumes
    ) {
        parent::__construct($id, $title, $genres, $rating, $year, $status, $summary);
        $this->volumes = $volumes;
    }

    public function getType(): string
    {
        return 'Light Novel';
    }

    public function getLength(): int
    {
        return $this->volumes;
    }

    public function getLengthLabel(): string
    {
        return $this->volumes . ' volume';
    }
}
