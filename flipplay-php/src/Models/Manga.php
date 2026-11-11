<?php

declare(strict_types=1);

namespace FlipPlay\Models;

class Manga extends Media
{
    private int $chapters;

    public function __construct(
        int $id,
        string $title,
        array $genres,
        float $rating,
        int $year,
        string $status,
        string $summary,
        int $chapters
    ) {
        parent::__construct($id, $title, $genres, $rating, $year, $status, $summary);
        $this->chapters = $chapters;
    }

    public function getType(): string
    {
        return 'Manga';
    }

    public function getLength(): int
    {
        return $this->chapters;
    }

    public function getLengthLabel(): string
    {
        return $this->chapters . ' chapter';
    }
}
