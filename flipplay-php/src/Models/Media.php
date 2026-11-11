<?php

declare(strict_types=1);

namespace FlipPlay\Models;

/**
 * Class induk (abstract) untuk semua jenis media di FlipPlay.
 * Anime, Drama, Manga, dan LightNovel mewarisi class ini.
 */
abstract class Media
{
    // Property: protected agar bisa dipakai class turunan, tapi tidak bisa diubah dari luar.
    protected int $id;
    protected string $title;
    protected array $genres;
    protected float $rating;
    protected int $year;
    protected string $status;
    protected string $summary;

    public function __construct(
        int $id,
        string $title,
        array $genres,
        float $rating,
        int $year,
        string $status,
        string $summary
    ) {
        $this->id = $id;
        $this->title = $title;
        $this->genres = $genres;
        $this->setRating($rating);
        $this->year = $year;
        $this->status = $status;
        $this->summary = $summary;
    }

    // Method abstract: wajib diimplementasikan oleh setiap class turunan.
    abstract public function getType(): string;

    abstract public function getLength(): int;

    abstract public function getLengthLabel(): string;

    // ===== Getter (public) =====
    public function getId(): int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getGenres(): array
    {
        return $this->genres;
    }

    public function getRating(): float
    {
        return $this->rating;
    }

    public function getYear(): int
    {
        return $this->year;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getSummary(): string
    {
        return $this->summary;
    }

    // Private: validasi rating hanya boleh dipanggil dari dalam class ini.
    private function setRating(float $rating): void
    {
        $this->rating = max(0.0, min(10.0, $rating));
    }

    public function hasGenre(string $genre): bool
    {
        return in_array($genre, $this->genres, true);
    }

    public function isFinished(): bool
    {
        return $this->status === 'Tamat';
    }

    // Satu baris ringkas untuk daftar media.
    public function getShortInfo(): string
    {
        return sprintf(
            '[#%-2d] %-34s | %-11s | %-12s | rating %.1f',
            $this->id,
            $this->title,
            $this->getType(),
            $this->getLengthLabel(),
            $this->rating
        );
    }

    // Detail lengkap; satuan panjang berbeda tiap turunan lewat getLengthLabel().
    public function getDetail(): string
    {
        return implode(PHP_EOL, [
            "Judul    : {$this->title}",
            "Jenis    : {$this->getType()}",
            'Genre    : ' . implode(', ', $this->genres),
            "Tahun    : {$this->year}",
            "Status   : {$this->status}",
            "Panjang  : {$this->getLengthLabel()}",
            "Rating   : " . number_format($this->rating, 1) . "/10",
            "Sinopsis : {$this->summary}",
        ]);
    }
}
