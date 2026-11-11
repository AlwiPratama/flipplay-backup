<?php

declare(strict_types=1);

namespace FlipPlay\Users;

use FlipPlay\Models\Media;

class User
{
    private string $name;
    private array $collection = [];

    public function __construct(string $name)
    {
        $this->name = $name;
    }

    public function getName(): string
    {
        return $this->name;
    }

    // Mengembalikan false jika media sudah ada di koleksi.
    public function addToCollection(Media $media): bool
    {
        if (isset($this->collection[$media->getId()])) {
            return false;
        }

        $this->collection[$media->getId()] = $media;

        return true;
    }

    /** @return Media[] */
    public function getCollection(): array
    {
        return array_values($this->collection);
    }
}
