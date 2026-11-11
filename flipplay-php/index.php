<?php

declare(strict_types=1);

use FlipPlay\Models\Anime;
use FlipPlay\Models\Drama;
use FlipPlay\Models\LightNovel;
use FlipPlay\Models\Manga;
use FlipPlay\Models\Media;
use FlipPlay\Services\MediaLibrary;
use FlipPlay\Users\User;

// Autoload sederhana: FlipPlay\Models\Anime  ->  src/Models/Anime.php
spl_autoload_register(function (string $class): void {
    $prefix = 'FlipPlay\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $path = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) {
        require $path;
    }
});

function judul(string $text): void
{
    echo PHP_EOL . str_repeat('=', 78) . PHP_EOL . "  $text" . PHP_EOL . str_repeat('=', 78) . PHP_EOL;
}

/** @param Media[] $list */
function tampilkanDaftar(array $list): void
{
    if ($list === []) {
        echo "  (tidak ada hasil)" . PHP_EOL;
        return;
    }
    foreach ($list as $media) {
        echo '  ' . $media->getShortInfo() . PHP_EOL;
    }
}

// ---------------------------------------------------------------------------
// 1. Menambahkan media ke dalam library
// ---------------------------------------------------------------------------
judul('1. MENAMBAHKAN MEDIA KE LIBRARY');

$library = new MediaLibrary();

$data = [
    new Anime(1, 'Fullmetal Alchemist: Brotherhood', ['Action', 'Adventure'], 9.1, 2009, 'Tamat', 'Dua bersaudara mencari cara mengembalikan tubuh mereka setelah eksperimen alkimia yang gagal.', 64),
    new Anime(2, 'Attack on Titan', ['Action', 'Drama'], 8.6, 2013, 'Tamat', 'Umat manusia bertahan hidup di balik tembok yang melindungi mereka dari para Titan.', 25),
    new Anime(3, 'Haikyu!!', ['Sports', 'Comedy'], 8.4, 2014, 'Tamat', 'Shoyo Hinata mengejar mimpinya menjadi pemain voli hebat bersama tim SMA Karasuno.', 25),
    new Anime(4, 'Violet Evergarden', ['Drama', 'Fantasy'], 8.7, 2018, 'Tamat', 'Seorang mantan prajurit belajar memahami perasaan manusia lewat kata-kata yang ia tulis.', 13),
    new Anime(5, 'One Piece', ['Action', 'Adventure'], 8.7, 1999, 'Tayang', 'Monkey D. Luffy dan kru Topi Jerami berlayar mencari harta karun legendaris.', 1000),
    new Anime(6, 'Your Lie in April', ['Drama', 'Romance'], 8.6, 2014, 'Tamat', 'Seorang pianis muda menemukan kembali musik dan warna hidupnya setelah bertemu pemain biola.', 22),
    new Anime(7, "Frieren: Beyond Journey's End", ['Adventure', 'Drama', 'Fantasy'], 9.3, 2023, 'Tamat', 'Penyihir elf Frieren menempuh perjalanan baru untuk memahami manusia dan kenangan.', 28),
    new Anime(8, 'Mob Psycho 100', ['Action', 'Comedy'], 8.5, 2016, 'Tamat', 'Shigeo Kageyama berusaha hidup biasa sambil mengendalikan kekuatan psikisnya.', 12),
    new Drama(9, 'Reply 1988', ['Drama', 'Comedy'], 9.2, 2015, 'Tamat', 'Kisah lima keluarga bertetangga di Seoul pada akhir 1980-an.', 20),
    new Manga(10, 'Vagabond', ['Action', 'Drama'], 9.0, 1998, 'Hiatus', 'Perjalanan Miyamoto Musashi menjadi pendekar pedang terkuat.', 327),
    new Manga(11, 'Yotsuba&!', ['Comedy'], 8.6, 2003, 'Tayang', 'Keseharian gadis kecil Yotsuba yang penuh rasa ingin tahu.', 112),
    new LightNovel(12, 'Mushoku Tensei', ['Adventure', 'Fantasy'], 8.5, 2012, 'Tamat', 'Seorang pria dewasa terlahir kembali di dunia sihir dan menjalani hidup baru.', 28),
];

foreach ($data as $media) {
    $library->add($media);
    echo "  + Ditambahkan: {$media->getTitle()} ({$media->getType()})" . PHP_EOL;
}
echo PHP_EOL . "  Total media di library: {$library->count()}" . PHP_EOL;

// ---------------------------------------------------------------------------
// 2. Menampilkan daftar media yang tersedia
// ---------------------------------------------------------------------------
judul('2. DAFTAR MEDIA YANG TERSEDIA');
tampilkanDaftar($library->all());

// ---------------------------------------------------------------------------
// 3. Mencari media berdasarkan judul
// ---------------------------------------------------------------------------
judul('3. PENCARIAN: "on" (judul mengandung kata tersebut)');
tampilkanDaftar($library->searchByTitle('on'));

judul('3b. PENCARIAN: "xyz" (tidak ditemukan)');
tampilkanDaftar($library->searchByTitle('xyz'));

// ---------------------------------------------------------------------------
// 4. Menampilkan informasi detail suatu media
// ---------------------------------------------------------------------------
judul('4. DETAIL MEDIA #7');
$detail = $library->findById(7);
echo $detail !== null ? $detail->getDetail() . PHP_EOL : "  Media tidak ditemukan." . PHP_EOL;

judul('4b. DETAIL MEDIA #10 (Manga, beda satuan panjang)');
echo $library->findById(10)?->getDetail() . PHP_EOL;

// ---------------------------------------------------------------------------
// 5. Menampilkan koleksi milik pengguna
// ---------------------------------------------------------------------------
judul('5. KOLEKSI MILIK PENGGUNA');
$user = new User('Alwi');

foreach ([7, 9, 10, 12, 7] as $id) {   // id 7 sengaja dimasukkan dua kali
    $media = $library->findById($id);
    if ($media === null) {
        continue;
    }
    echo $user->addToCollection($media)
        ? "  + {$media->getTitle()} masuk koleksi {$user->getName()}" . PHP_EOL
        : "  ! {$media->getTitle()} sudah ada di koleksi (dilewati)" . PHP_EOL;
}

echo PHP_EOL . "  Koleksi {$user->getName()}:" . PHP_EOL;
tampilkanDaftar($user->getCollection());

// ---------------------------------------------------------------------------
// Bonus: filter "Aura" seperti Vibe Grid di website
// ---------------------------------------------------------------------------
judul('BONUS. FILTER AURA (seperti Vibe Grid)');
foreach (['high-energy', 'melancholy', 'binge'] as $aura) {
    echo PHP_EOL . "  Aura: $aura" . PHP_EOL;
    tampilkanDaftar($library->filterByAura($aura));
}

echo PHP_EOL . 'Simulasi selesai.' . PHP_EOL;
