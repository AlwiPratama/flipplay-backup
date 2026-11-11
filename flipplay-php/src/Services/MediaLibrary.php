<?php

declare(strict_types=1);

namespace FlipPlay\Services;

use FlipPlay\Models\Media;

/**
 * Menyimpan seluruh media yang tersedia di FlipPlay
 * beserta fitur cari dan filter "Aura" (sama seperti Vibe Grid di website).
 */
class MediaLibrary
{
    private array $items = [];

    public function add(Media $media): void
    {
        $this->items[$media->getId()] = $media;
    }

    /** @return Media[] */
    public function all(): array
    {
        return array_values($this->items);
    }

    public function count(): int
    {
        return count($this->items);
    }

    public function findById(int $id): ?Media
    {
        return $this->items[$id] ?? null;
    }

    /** @return Media[] */
    public function searchByTitle(string $keyword): array
    {
        $keyword = trim($keyword);

        // stripos = pencarian tanpa membedakan huruf besar/kecil
        return array_values(array_filter(
            $this->items,
            fn (Media $m): bool => $keyword !== '' && stripos($m->getTitle(), $keyword) !== false
        ));
    }

    /**
     * Aura: high-energy, melancholy, binge (aturan sama dengan vibe-grid.js).
     * @return Media[]
     */
    public function filterByAura(string $aura): array
    {
        $rule = match ($aura) {
            'high-energy' => fn (Media $m): bool => $this->hasAnyGenre($m, ['Action', 'Adventure', 'Sci-Fi', 'Sports']),
            'melancholy'  => fn (Media $m): bool => $this->hasAnyGenre($m, ['Drama', 'Romance']) && !$m->hasGenre('Comedy'),
            'binge'       => fn (Media $m): bool => ($m->isFinished() && $m->getRating() >= 8) || $m->getLength() >= 24,
            default       => fn (Media $m): bool => true,
        };

        return array_values(array_filter($this->items, $rule));
    }

    private function hasAnyGenre(Media $media, array $genres): bool
    {
        foreach ($genres as $genre) {
            if ($media->hasGenre($genre)) {
                return true;
            }
        }

        return false;
    }
}
