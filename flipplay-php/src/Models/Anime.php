<?php

declare(strict_types=1);

namespace FlipPlay\Models;

class Anime extends Media
{
    private int $episodes;

    public function __construct(
        int $id,
        string $title,
        array $genres,
        float $rating,
        int $year,
        string $status,
        string $summary,
        int $episodes
    ) {
        parent::__construct($id, $title, $genres, $rating, $year, $status, $summary);
        $this->episodes = $episodes;
    }

    public function getType(): string
    {
        return 'Anime';
    }

    public function getLength(): int
    {
        return $this->episodes;
    }

    public function getLengthLabel(): string
    {
        return $this->episodes . ' episode';
    }
}
