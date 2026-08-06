// Annotation database for "Autobiography of a Yogi"
// Each entry links in-text terms to a note, an image, and external references.
// image: filename on Wikimedia Commons (or null). app.js builds the URL from it.
window.ANNOTATIONS = [
  {
  id: "yogananda",
  label: "Paramahansa Yogananda",
  terms: ["Paramahansa Yogananda", "Yogananda", "Mukunda"],
  image: "Paramahansa_Yogananda.jpg",
  note: "Mukunda Lal Ghosh (1893–1952), born in Gorakhpur, India, was the author of this autobiography. In 1914 he entered the ancient Swami Order and took the name Yogananda; in 1935 his guru Sri Yukteswar bestowed on him the title Paramahansa.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Paramahansa_Yogananda" }, { label: "Wikisource (this book)", url: "https://en.wikisource.org/wiki/Autobiography_of_a_Yogi" }]
  },   {
  id: "yukteswar",
  label: "Sri Yukteswar Giri",
  terms: ["Sri Yukteswar", "Yukteswar", "Master Yukteswar", "Yukteswarji"],
  image: "Swami_Sri_Yukteswar_Pose.jpg",
  note: "Swami Sri Yukteswar Giri (1855–1936) was Yogananda's guru, a great Kriya Yoga master of the lineage of Mahavatar Babaji and Lahiri Mahasaya. His hermitage at Serampore was the young Yogananda's spiritual home.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Swami_Sri_Yukteswar_Giri" }]
  },   {
  id: "lahiri",
  label: "Lahiri Mahasaya",
  terms: ["Lahiri Mahasaya", "Lahiri"],
  image: "Lahiri_Mahasaya.jpg",
  note: "Shyama Charan Lahiri (1828–1895), called Lahiri Mahasaya, was the disciple of Mahavatar Babaji who revived Kriya Yoga in modern India. His 'Christlike life' is described in Chapter 35.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lahiri_Mahasaya" }]
  },   {
  id: "babaji",
  label: "Mahavatar Babaji",
  terms: ["Mahavatar Babaji", "Babaji"],
  image: "Mahavatar Babaji amulet 01.jpg",
  note: "Mahavatar Babaji is the ageless, ever-living Himalayan master who, in Yogananda's account, revived Kriya Yoga and commissioned Lahiri Mahasaya to spread it. He is said to have been seen in the body for centuries.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mahavatar_Babaji" }]
  },   {
  id: "kriya",
  label: "Kriya Yoga",
  terms: ["Kriya Yoga", "Kriya"],
  image: "Yoga_Meditation_Pos-410px.png",
  note: "Kriya Yoga is a rapid technique of God-realization taught to Yogananda by his lineage. By systematically calming the breath and life-force, the yogi stills the sensory tumult and approaches cosmic consciousness.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kriya_Yoga" }]
  },   {
  id: "gandhi",
  label: "Mahatma Gandhi",
  terms: ["Mahatma Gandhi", "Gandhi"],
  image: "Mahatma-Gandhi,_studio,_1931.jpg",
  note: "Mohandas K. Gandhi (1869–1948), the great apostle of nonviolence, met Yogananda at his Wardha ashram — the scene of Chapter 44. Yogananda sang devotional hymns for him and translated his commentary on the Bhagavad Gita.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mahatma_Gandhi" }]
  },   {
  id: "tagore",
  label: "Rabindranath Tagore",
  terms: ["Rabindranath Tagore", "Tagore"],
  image: "Rabindranath_Tagore.jpg",
  note: "Rabindranath Tagore (1861–1941), India's first Nobel laureate in literature, founded his school at Santiniketan. Yogananda compares his own Ranchi school with Tagore's in Chapter 29.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Rabindranath_Tagore" }]
  },   {
  id: "vivekananda",
  label: "Swami Vivekananda",
  terms: ["Vivekananda"],
  image: "Photograph of Swami Vivekananda in Chicago, September 1893 with his signature.jpg",
  note: "Swami Vivekananda (1863–1902), a foremost disciple of Sri Ramakrishna, carried Vedanta to the West and was a towering figure in the Bengali spiritual revival that shaped Yogananda's world.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Swami_Vivekananda" }]
  },   {
  id: "ramakrishna",
  label: "Sri Ramakrishna",
  terms: ["Ramakrishna"],
  image: "Ramakrishna.jpg",
  note: "Sri Ramakrishna Paramahamsa (1836–1886) was the ecstatic sage of the Dakshineswar Kali Temple, whose life exemplifies the direct, devotional realization of God that permeates this book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ramakrishna" }]
  },   {
  id: "anandamayi",
  label: "Ananda Moyi Ma",
  terms: ["Ananda Moyi Ma", "Anandamayi", "Ananda Moyi"],
  image: "Sri_Anandamayi_Ma.jpg",
  note: "Ananda Moyi Ma (1896–1982) — 'the Joy-Permeated Mother' — was a revered Bengali saint whom Yogananda visited and wrote about in Chapter 45, calling her 'a little girl of twenty whom God has sent to give darshan.'",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Anandamayi_Ma" }]
  },   {
  id: "therese",
  label: "Therese Neumann",
  terms: ["Therese Neumann", "Theresa Neumann"],
  image: "Bundesarchiv_Bild_102-00241,_Therese_Neumann.jpg",
  note: "Therese Neumann (1898–1962) of Konnersreuth, Bavaria, was a Catholic stigmatist who reportedly lived without food, showed the wounds of Christ, and had visions — examined closely by Yogananda in Chapter 39.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Therese_Neumann" }]
  },   {
  id: "burbank",
  label: "Luther Burbank",
  terms: ["Luther Burbank", "Burbank"],
  image: "Luther_Burbank.jpg",
  note: "Luther Burbank (1849–1926) was an American plant-breeder and horticulturist; Yogananda calls him an 'American saint' and devotes Chapter 38 to their friendship and shared vision of a spiritual science.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Luther_Burbank" }]
  },   {
  id: "kali",
  label: "Kali, the Divine Mother",
  terms: ["Kali, the Divine Mother", "Kali"],
  image: "Kali_Statue_01.jpg",
  note: "Kali is the Hindu goddess of time and change, a symbol of God as eternal Mother Nature. The great Kali temple at Dakshineswar, near Calcutta, figures in the lives of Sri Ramakrishna and Yogananda's lineage.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kali" }]
  },   {
  id: "gita",
  label: "Bhagavad Gita",
  terms: ["Bhagavad Gita", "the Gita", "Gita"],
  image: "Krishna Arjuna Gita.jpg",
  note: "The Bhagavad Gita ('Song of God') is a 700-verse Sanskrit poem within the Mahabharata. Yogananda calls it 'the Hindu Bible'; his own monumental commentary is the two-volume God Talks with Arjuna.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bhagavad_Gita" }]
  },   {
  id: "himalaya",
  label: "The Himalayas",
  terms: ["Himalayan", "Himalayas", "Himalaya"],
  image: "Himalayas.jpg",
  note: "The Himalayan snows are the legendary abode of India's yogis and sages — the setting of Yogananda's distant memories of a past life, and of Mahavatar Babaji's timeless presence.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Himalayas" }]
  },   {
  id: "tajmahal",
  label: "The Taj Mahal",
  terms: ["Taj Mahal"],
  image: "Taj_Mahal,_Agra,_India_edit2.jpg",
  note: "The Taj Mahal at Agra, the white-marble mausoleum built by the Mughal emperor Shah Jahan for his wife Mumtaz Mahal, is one of the most celebrated buildings Yogananda encounters on his Indian travels.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Taj_Mahal" }]
  },   {
  id: "calcutta",
  label: "Calcutta (Kolkata)",
  terms: ["Calcutta", "Kolkata"],
  image: "Calcutta.jpg",
  note: "Calcutta (now Kolkata), the capital of British Bengal, was the great city where Yogananda grew up amid its crowded lanes, the Ganges riverfront, and the 'springs of a new renaissance.'",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kolkata" }]
  },   {
  id: "dakshineswar",
  label: "Dakshineswar",
  terms: ["Dakshineswar"],
  image: "Dakshineswar_Kali_Temple,_Dakshineswar,_North_24_Parganas_district,_India.jpg",
  note: "Dakshineswar, on the Ganges north of Calcutta, is the site of the famous Kali temple where Sri Ramakrishna lived and attained his God-vision.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dakshineswar_Kali_Temple" }]
  },   {
  id: "serampore",
  label: "Serampore",
  terms: ["Serampore"],
  image: "Hooghly_River_@_Serampore.jpg",
  note: "Serampore, on the Hooghly River, was where Sri Yukteswar's hermitage stood — the scene of Yogananda's most formative years and of his guru's 'simultaneous appearance' in Chapter 19.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Serampore" }]
  },   {
  id: "varanasi",
  label: "Varanasi (Benares / Kashi)",
  // "Benares"/"Kashi" are owned by the dedicated `benares` entry below; keeping
  // them here too would let buildTermIndex's last-write-wins silently strand one
  // annotation. Unique terms keep both reachable.
  terms: ["Varanasi"],
  image: "Varanasi_Munshi_Ghat3.jpg",
  note: "Varanasi (Benares, or Kashi) on the Ganges is among the world's oldest living cities and Hinduism's holiest — where Yogananda meets Kashi, the reborn disciple, in Chapter 28.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Varanasi" }]
  },   {
  id: "gorakhpur",
  label: "Gorakhpur",
  terms: ["Gorakhpur"],
  image: "Gorakhpur_,_India.jpg",
  note: "Gorakhpur, in the United Provinces of northeastern India, was Yogananda's birthplace, where he spent his first eight years and where the family's spiritual practices took hold.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Gorakhpur" }]
  },   {
  id: "buddha",
  label: "Gautama Buddha",
  terms: ["Buddha"],
  image: "Large Gautama Buddha statue in Buddha Park of Ravangla, Sikkim.jpg",
  note: "Gautama Buddha (c. 563–483 BCE), the enlightened founder of Buddhism, is frequently evoked in the book as an exemplar of meditative realization and universal compassion.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Gautama_Buddha" }]
  },   {
  id: "swami",
  label: "The Swami Order",
  terms: ["Swami Order", "swami order"],
  image: "Swami Vivekananda 1893 with The East Indian Group.jpg",
  note: "The Swami Order, founded by the sage Shankara, is the ancient monastic order into which Yogananda was initiated in 1914, taking the monastic name Yogananda ('joy through divine union').",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Swami" }]
  },   {
  id: "om",
  label: "AUM (Om), the Cosmic Word",
  terms: ["AUM", "Om"],
  image: "Om devanagari.PNG",
  note: "AUM (Om) is the Sanskrit seed-syllable believed to be the cosmic vibratory sound behind all creation — the 'Word' that yogis hear within in deep meditation.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Om" }]
  },   {
  id: "pranabananda",
  label: "Swami Pranabananda",
  terms: ["Pranabananda", "Swami Pranabananda"],
  image: "Swami Pranabananda.jpg",
  note: "A great disciple of Lahiri Mahasaya and senior Kriya Yoga master in Benares, whom the young Yogananda and his brother met in Chapter 3. He could appear in two places at once.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Swami_Pranabananda" }]
  },   {
  id: "master_mahasaya",
  label: "Master Mahasaya",
  terms: ["Master Mahasaya"],
  image: null,
  note: "The blissful devotee of Lahiri Mahasaya whose ecstatic 'cosmic romance' is the subject of Chapter 9.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Master_Mahasaya" }]
  },   {
  id: "nagendra_bhaduri",
  label: "Nagendra Nath Bhaduri",
  terms: ["Nagendra Nath Bhaduri", "Bhaduri"],
  image: null,
  note: "The levitating saint and Calcutta college lecturer described in Chapter 7, whose mastery of air suspended him in meditation.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nagendra_Nath_Bhaduri" }]
  },   {
  id: "jagadis_bose",
  label: "Jagadis Chandra Bose",
  terms: ["Jagadis Chandra Bose", "Jagadish Chandra Bose", "J. C. Bose", "Bose"],
  image: "1920 Jagadish Chandra Bose.jpg",
  note: "Pioneering Indian physicist and plant physiologist, founder of the Bose Institute, whom Yogananda visited in Chapter 8. He demonstrated that plants respond to stimuli much as animals do.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Jagadish_Chandra_Bose" }]
  },   {
  id: "ram_gopal_muzumdar",
  label: "Ram Gopal Muzumdar",
  terms: ["Ram Gopal Muzumdar", "Ram Gopal"],
  image: null,
  note: "The 'sleepless saint' of Chapter 13, who claimed to have gone without sleep for over a decade through concentrated yogic practice.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ram_Gopal_Muzumdar" }]
  },   {
  id: "afzal_khan",
  label: "Afzal Khan",
  terms: ["Afzal Khan"],
  image: null,
  note: "The Mohammedan wonder-worker featured in Chapter 18, famous for levitation and other feats performed before the prince of Malabar.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Afzal_Khan_(spiritual_teacher)" }]
  },   {
  id: "kashi_moni",
  label: "Kashi Moni Lahiri",
  terms: ["Kashi Moni Lahiri", "Kashi Moni"],
  image: null,
  note: "Daughter of Lahiri Mahasaya, the 'Sacred Mother' interviewed in Chapter 31, who lived a long life of simple holiness.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kashi_Moni" }]
  },   {
  id: "giri_bala",
  label: "Giri Bala",
  terms: ["Giri Bala"],
  image: null,
  note: "The Bengali woman yogi, 'the woman who never eats,' whose extraordinary life is told in Chapter 46.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Giri_Bala" }]
  },   {
  id: "ranc",
  label: "Ranchi",
  terms: ["Ranchi"],
  image: "Ranchi Cityscape.jpg",
  note: "City in what is now Jharkhand, India, where Yogananda founded his yoga school (Brahmananda Ashram) in 1917, described in Chapter 27.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ranchi" }]
  },   {
  id: "brindaban",
  label: "Brindaban",
  terms: ["Brindaban", "Vrindavan"],
  image: "Radhavallabh Lal ju Maharaj Temple Vrindavan 2022 17.jpg",
  note: "The sacred town near Mathura associated with the boyhood pastimes of Krishna; Yogananda visited it in Chapter 11.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vrindavan" }]
  },   {
  id: "kashmir",
  label: "Kashmir",
  terms: ["Kashmir"],
  image: "Horses grazing at Trunkol meadow, Jammu and Kashmir, India (crop).jpg",
  note: "The Himalayan valley Yogananda visited with Sri Yukteswar in Chapters 20-21.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kashmir" }]
  },   {
  id: "wardha",
  label: "Wardha",
  terms: ["Wardha"],
  image: "Viswasanthi Stupa, Wardha.JPG",
  note: "The town in Maharashtra where Gandhi's ashram was located; Yogananda stayed with him there (Chapter 44).",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Wardha" }]
  },   {
  id: "encinitas",
  label: "Encinitas",
  terms: ["Encinitas"],
  image: "MoonlightBeach EncinitasCA.jpg",
  note: "The coastal California town where Yogananda's Self-Realization Fellowship ashram and 'Golden Age' hermitage were established (Chapter 48).",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Encinitas,_California" }]
  },   {
  id: "boston",
  label: "Boston",
  terms: ["Boston"],
  image: "Boston Financial District skyline.jpg",
  note: "The American city where Yogananda arrived in 1920, opening the work of Self-Realization Fellowship in the West (Chapter 37).",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Boston" }]
  },   {
  id: "los_angeles",
  label: "Los Angeles",
  terms: ["Los Angeles"],
  image: "Los Angeles Skyline; August 30, 2022.jpg",
  note: "West-coast headquarters of Yogananda's American work and daily habitat after settling in California.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Los_Angeles" }]
  },   {
  id: "agra",
  label: "Agra",
  terms: ["Agra"],
  image: "Taj Mahal, Agra, India edit2.jpg",
  note: "Indian city famed for the Taj Mahal, which Yogananda passed on his journeys across northern India.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Agra" }]
  },   {
  id: "ganges",
  label: "Ganges River",
  terms: ["Ganges", "Ganga"],
  image: "Boats at sunrise Ganges River Varanasi Uttar Pradesh Schwiki.jpg",
  note: "The sacred river of northern India, which flows through Varanasi and other holy cities central to the pilgrimage accounts.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ganges" }]
  },   {
  id: "simla",
  label: "Simla",
  terms: ["Simla"],
  image: "Mall Road, Shimla 2.jpg",
  note: "Hill station in the Himalayas, visited during Yogananda's early Himalayan journeys.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Shimla" }]
  },   {
  id: "allahabad",
  label: "Prayag (Allahabad)",
  terms: ["Allahabad", "Prayag"],
  image: "Boat Pilgrims Triveni Sangam Allahabad Jan24 A7C 08513.jpg",
  note: "Confluence city of the Ganges and Yamuna, site of the great Kumbha Mela gatherings described in the book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Prayagraj" }]
  },   {
  id: "everest",
  label: "Mount Everest",
  terms: ["Mount Everest", "Everest"],
  image: "Mount Everest as seen from Drukair2 PLW edit.jpg",
  note: "The world's highest peak, mentioned in Yogananda's accounts of the Himalayas.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mount_Everest" }]
  },   {
  id: "kumbha",
  label: "Kumbha Mela",
  terms: ["Kumbha Mela", "Kumbh Mela"],
  image: "Gathering of Devotees at Kumbha Mela 2025.jpg",
  note: "The great periodic Hindu pilgrimage festival at which vast crowds bathe at sacred river confluences.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kumbh_Mela" }]
  },   {
  id: "vedas",
  label: "The Vedas",
  terms: ["Vedas", "Rig Veda", "Sama Veda"],
  image: "Rigveda palm leaf, Sanskrit language, Sharada script, Kashmir.jpg",
  note: "The oldest sacred scriptures of India, the four Vedas, which underlie much of the yogic worldview described in the book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vedas" }]
  },   {
  id: "mahabharata",
  label: "Mahabharata",
  terms: ["Mahabharata", "Mahabharat"],
  image: "The Graet Gambling Scene of the Mahabharata, Albert Hall Museum, Jaipur.jpg",
  note: "The great Sanskrit epic that includes the Bhagavad Gita, frequently cited in the book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mahabharata" }]
  },   {
  id: "ramayana",
  label: "Ramayana",
  terms: ["Ramayana"],
  image: "Battle at Lanka, Ramayana, Udaipur, 1649-53.jpg",
  note: "The ancient Sanskrit epic of Rama, one of the two great Indian epics alongside the Mahabharata.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ramayana" }]
  },   {
  id: "patanjali",
  label: "Patanjali",
  terms: ["Patanjali"],
  image: "Patanjali Statue.jpg",
  note: "The ancient sage who codified the Yoga Sutras, the classical source of the eight-limbed path of yoga.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Patanjali" }]
  },   {
  id: "yoga_sutras",
  label: "Yoga Sutras of Patanjali",
  terms: ["Yoga Sutras", "Patanjali's Yoga Sutra"],
  image: "Patanjali Yoga Sutras manuscript.jpg",
  note: "The classical treatise on the philosophy and practice of yoga, composed by Patanjali.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Yoga_Sutras_of_Patanjali" }]
  },   {
  id: "samadhi",
  label: "Samadhi",
  terms: ["samadhi"],
  image: "Buddha meditating.jpg",
  note: "The highest state of meditative absorption and union with the Divine in yogic tradition.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Samadhi" }]
  },   {
  id: "karma",
  label: "Karma",
  terms: ["karma"],
  image: "Buddha Dharmachakra Mudra with Ashok Chakra.jpg",
  note: "The law of cause and effect whereby one's actions shape present and future experience.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Karma" }]
  },   {
  id: "reincarnation",
  label: "Reincarnation",
  terms: ["reincarnation", "Reincarnation"],
  image: "The wheel of life, Buddhism Bhavachakra.jpg",
  note: "The belief, central to Hindu and yogic thought, that the soul takes successive births.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Reincarnation" }]
  },   {
  id: "astral",
  label: "Astral world",
  terms: ["astral"],
  image: "Milky way1.jpg",
  note: "The subtle 'light' plane of existence described by Yogananda, where disembodied souls and astral light animate the universe.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Astral_body" }]
  },   {
  id: "brahman",
  label: "Brahman",
  terms: ["Brahman"],
  image: "Om devanagari.PNG",
  note: "The absolute, attributeless reality underlying the cosmos in Vedantic philosophy.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Brahman" }]
  },   {
  id: "atman",
  label: "Atman",
  terms: ["Atman"],
  image: "A lit Diyo.jpg",
  note: "The individual soul or inner Self, held to be identical in essence with Brahman.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Atman_(Hinduism)" }]
  },   {
  id: "pranayama",
  label: "Pranayama",
  terms: ["pranayama"],
  image: "Pranayama in goa.jpg",
  note: "The yogic science of breath control, which purifies the subtle life-currents.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Pranayama" }]
  },   {
  id: "mantra",
  label: "Mantra",
  terms: ["mantra"],
  image: "Jain Mantra depictions.jpg",
  note: "A sacred sound, syllable, or phrase used in meditation as a focus of inner attention.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mantra" }]
  },   {
  id: "darshan",
  label: "Darshan",
  terms: ["darshan"],
  image: "Evening Ganges aarti lamp, Varanasi.jpg",
  note: "The auspicious sight or vision of a holy person or deity, regarded as a blessing.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Darshan" }]
  },   {
  id: "ashram",
  label: "Ashram",
  terms: ["ashram"],
  image: "Sabarmati-Ashram-8.jpg",
  note: "A spiritual hermitage or monastery where disciples live under a teacher.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ashram" }]
  },   {
  id: "krishna",
  label: "Krishna",
  terms: ["Krishna"],
  image: "Radha- Krishna, Kalighat Painting.jpg",
  note: "The divine incarnation whose teaching forms the Bhagavad Gita; a central figure in the book's spiritual lineage.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Krishna" }]
  },   {
  id: "shiva",
  label: "Shiva",
  terms: ["Shiva"],
  image: "Adiyogi Shiva statue night.jpg",
  note: "One of the principal deities of Hinduism, especially revered in yogic and ascetic tradition.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Shiva" }]
  },   {
  id: "durga",
  label: "Durga",
  terms: ["Durga"],
  image: "Haridevpur 41 Pally Durga Puja 2019.jpg",
  note: "The Divine Mother in her powerful warrior form, worshipped widely in Bengal.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Durga" }]
  },   {
  id: "sadhu",
  label: "Sadhu",
  terms: ["sadhu"],
  image: "Sadhu Vârânasî.jpg",
  note: "A wandering ascetic or holy man dedicated to spiritual practice.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sadhu" }]
  },   {
  id: "sanyasi",
  label: "Sanyasi",
  terms: ["sanyasi", "sannyasi"],
  image: "Sadhu Vârânasî.jpg",
  note: "A renunciant who has formally given up worldly life in pursuit of liberation.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sannyasa" }]
  },   {
  id: "jesus",
  label: "Jesus Christ",
  terms: ["Jesus Christ", "Christ", "Christ Jesus"],
  image: "Claude Mellan - Face of Christ - WGA14764.jpg",
  note: "The central figure of Christianity, whose teachings Yogananda frequently compared with the Kriya Yoga path.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Jesus" }]
  },   {
  id: "ananta",
  label: "Brother Ananta",
  terms: ["Ananta"],
  image: null,
  note: "Yogananda's elder brother Ananta, whose shrewd, steady character is recalled in Chapter 25.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ananta_Gosh" }]
  },   {
  id: "nalini",
  label: "Sister Nalini",
  terms: ["Nalini"],
  image: null,
  note: "Yogananda's devoted sister Nalini, remembered lovingly in Chapter 25.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nalini" }]
  },   {
  id: "roma",
  label: "Sister Roma",
  terms: ["Roma"],
  image: null,
  note: "Yogananda's elder sister Roma, who shared in the family's spiritual life in Calcutta.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Roma" }]
  },   {
  id: "bishnu",
  label: "Brother Bishnu",
  terms: ["Bishnu"],
  image: "Bishnu Charan Ghosh, atop motorcycle, 1919.jpg",
  note: "Yogananda's brother Bishnu, a lively presence in the early family years.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bishnu" }]
  },   {
  id: "sananda",
  label: "Brother Sananda",
  terms: ["Sananda"],
  image: null,
  note: "Yogananda's brother Sananda, part of the large Ghosh family in Bengal.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sananda" }]
  },   {
  id: "tulsi",
  label: "Brother Tulsi",
  terms: ["Tulsi"],
  image: null,
  note: "Yogananda's brother Tulsi.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Tulsi" }]
  },   {
  id: "tiger_swami",
  label: "The Tiger Swami",
  terms: ["Tiger Swami", "Vishuddhananda"],
  image: "Tiger swami.JPG",
  note: "Swami Vishuddhananda, the powerful 'tiger swami' of Chapter 6 who could outrun and overmaster a tiger by yogic strength.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vishuddhananda" }]
  },   {
  id: "perfume_saint",
  label: "The Perfume Saint",
  terms: ["Perfume Saint"],
  image: null,
  note: "The unnamed 'perfume saint' of Chapter 5, a Mohammedan who materialized rare fragrances at will.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Perfume_Saint" }]
  },   {
  id: "rishikesh",
  label: "Rishikesh",
  terms: ["Rishikesh"],
  image: "Kundalini Yoga Teacher Training in Rishikesh.jpg",
  note: "The Himalayan holy town on the Ganges, famed as a center of yoga and ashrams.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Rishikesh" }]
  },   {
  id: "hardwar",
  label: "Haridwar",
  terms: ["Hardwar", "Haridwar"],
  image: "Har Ki Pauri and Clock Tower of Haridwar.jpg",
  note: "The holy city on the Ganges where the great bathing festivals are held.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Haridwar" }]
  },   {
  id: "bombay",
  label: "Bombay",
  terms: ["Bombay", "Mumbai"],
  image: "Gateway of India Port Mumbai.jpg",
  note: "India's west-coast metropolis (now Mumbai), which Yogananda passed through on his travels.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mumbai" }]
  },   {
  id: "madras",
  label: "Madras",
  terms: ["Madras", "Chennai"],
  image: "Chennai Kapaleeshwarar Temple.jpg",
  note: "The south Indian city (now Chennai) near which the 'Idyll in South India' of Chapter 41 unfolds.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chennai" }]
  },   {
  id: "benares",
  label: "Benares",
  terms: ["Benares", "Kashi"],
  image: "Benares (Varanasi, India) - 1922.jpg",
  note: "The holy city on the Ganges (also Kashi and Varanasi), home of Lahiri Mahasaya and many saints of the book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Varanasi" }]
  },   {
  id: "bengalnagpur_railway",
  label: "Bengal-Nagpur Railway",
  terms: ["Bengal-Nagpur Railway", "Bengal Nagpur Railway"],
  image: "Bengal Nagpur Railway Logo.jpg",
  note: "The Bengal-Nagpur Railway was one of India's largest railway companies before Independence. Yogananda's father, Bhagabati Charan Ghosh, served as a vice-president of the company, and his executive post is mentioned repeatedly throughout the book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bengal_Nagpur_Railway" }]
  },   {
  id: "howrah",
  label: "Howrah",
  terms: ["Howrah"],
  image: null,
  note: "Howrah is the industrial city across the Hooghly from Calcutta, home to the great Howrah railway station and the iconic Howrah Bridge that Yogananda passed in his travels.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Howrah" }]
  },   {
  id: "henry_ford",
  label: "Henry Ford",
  terms: ["Henry Ford", "Mr. Ford", "Ford"],
  image: "Henry_Ford_1919.jpg",
  note: "American industrialist and founder of the Ford Motor Company, whom Yogananda met during his American years.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Henry_Ford" }]
  },   {
  id: "trailanga",
  label: "Trailanga Swami",
  terms: ["Trailanga", "Trailanga Swami"],
  image: "Trailanga Swami.jpg",
  note: "The great wandering yogi of Benares, famed for feats of levity and long meditation.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Trailanga_Swami" }]
  },   {
  id: "bhagabati",
  label: "Bhagabati Charan Ghosh",
  terms: ["Bhagabati", "Bhagabati Charan Ghosh"],
  image: null,
  note: "Yogananda's father, a vice-president of the Bengal-Nagpur Railway and a devoted disciple of Lahiri Mahasaya.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Paramahansa_Yogananda" }]
  },   {
  id: "adi_shankara",
  label: "Adi Shankara",
  terms: ["Shankaracharya", "Shankara", "Adi Shankara"],
  image: "AdiShankara1.jpg",
  note: "The great 8th-century philosopher who consolidated Advaita Vedanta, revered as Shankaracharya.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Adi_Shankara" }]
  },   {
  id: "kabir",
  label: "Kabir",
  terms: ["Kabir"],
  image: "Painting of bhagat Kabir with attendants, circa late 17th century.jpg",
  note: "The 15th-century Indian mystic poet whose verse blends Hindu and Muslim devotion.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kabir" }]
  },   {
  id: "tolstoy",
  label: "Leo Tolstoy",
  terms: ["Tolstoy", "Leo Tolstoy"],
  image: "L.N.Tolstoy Prokudin-Gorsky.jpg",
  note: "The Russian novelist whose moral and spiritual writings influenced Gandhi.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Leo_Tolstoy" }]
  },   {
  id: "bose_institute",
  label: "Bose Institute",
  terms: ["Bose Institute"],
  image: null,
  note: "The research institute founded by Jagadis Chandra Bose in Calcutta.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bose_Institute" }]
  },   {
  id: "dwarkanath",
  label: "Dwarkanath Tagore",
  terms: ["Dwarkanath Tagore"],
  image: null,
  note: "Early-19th-century Bengali merchant and philanthropist, grandfather of the poet.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dwarkanath_Tagore" }]
  },   {
  id: "bengal",
  label: "Bengal",
  terms: ["Bengal"],
  image: null,
  note: "The eastern region of India, homeland of Yogananda and of Bengali culture and spirituality.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bengal" }]
  },   {
  id: "mysore",
  label: "Mysore",
  terms: ["Mysore"],
  image: "Mysore Palace Morning.jpg",
  note: "City in southern India, historically a princely state.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mysore" }]
  },   {
  id: "hinduism",
  label: "Hinduism",
  terms: ["Hinduism"],
  image: null,
  note: "The major religious and cultural tradition of India from which yoga and the book's practices arise.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Hinduism" }]
  },   {
  id: "sanskrit",
  label: "Sanskrit",
  terms: ["Sanskrit"],
  image: null,
  note: "The classical liturgical language of India in which the scriptures are written.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sanskrit" }]
  },   {
  id: "upanishads",
  label: "The Upanishads",
  terms: ["Upanishads", "Upanishad"],
  image: null,
  note: "The philosophical scriptures appended to the Vedas, foundational to Vedanta.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Upanishads" }]
  },   {
  id: "bible",
  label: "The Bible",
  terms: ["Bible"],
  image: null,
  note: "The Christian scriptures, to which Yogananda compares yogic teachings.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bible" }]
  },   {
  id: "christianity",
  label: "Christianity",
  terms: ["Christianity", "Christian"],
  image: null,
  note: "The monotheistic religion founded on the life and teachings of Jesus Christ.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Christianity" }]
  },   {
  id: "avatar",
  label: "Avatar",
  terms: ["avatar", "Avatar"],
  image: null,
  note: "A divine incarnation that descends to the world.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Avatar" }]
  },   {
  id: "maya",
  label: "Maya",
  terms: ["maya", "Maya"],
  image: null,
  note: "The cosmic illusion that veils the underlying unitive reality.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Maya_(religion)" }]
  },   {
  id: "prana",
  label: "Prana",
  terms: ["prana", "Prana"],
  image: null,
  note: "The vital life-force or breath-energy cultivated in yoga.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Prana" }]
  },   {
  id: "bhakti",
  label: "Bhakti",
  terms: ["bhakti", "Bhakti"],
  image: null,
  note: "The path of loving devotion to the Divine in yoga.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bhakti" }]
  },   {
  id: "sri_aurobindo",
  label: "Sri Aurobindo",
  terms: ["Sri Aurobindo", "Aurobindo"],
  image: null,
  note: "Indian philosopher, yogi and poet (1872-1950), author of the commentary on the Bhagavad Gita cited in the notes.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sri_Aurobindo" }]
  },   {
  id: "edwin_arnold",
  label: "Edwin Arnold",
  terms: ["Edwin Arnold", "Sir Edwin Arnold"],
  image: "EdwinArnold.jpeg",
  note: "English poet and journalist whose verse translation of the Gita, 'The Song Celestial', is recommended in the notes.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Edwin_Arnold" }]
  },   {
  id: "evans_wentz",
  label: "W. Y. Evans-Wentz",
  terms: ["Evans-Wentz", "W. Y. Evans-Wentz"],
  image: "Crop Walter Evans-Wentz 1919.png",
  note: "American-born scholar of Tibetan Buddhism, editor of the 'Tibetan Yoga and Secret Doctrines' volume cited in the preface.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Walter_Y._Evans-Wentz" }]
  },   {
  id: "davisson",
  label: "Dr. C. J. Davisson",
  terms: ["Dr. Davisson", "Davisson", "C. J. Davisson"],
  image: "Clinton Davisson.jpg",
  note: "American physicist (1881-1958); the electron-diffraction experiments cited in the book helped establish wave-particle duality.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Clinton_Davisson" }]
  },   {
  id: "jung",
  label: "Carl Jung",
  terms: ["Dr. Jung", "Carl Jung", "Jung"],
  image: "Carl-Jung-mod.jpg",
  note: "Swiss psychiatrist (1875-1961) whose depth psychology is discussed in the book.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Carl_Jung" }]
  },   {
  id: "jeans",
  label: "James Jeans",
  terms: ["James Jeans", "Sir James Jeans", "Jeans"],
  image: "Philip Alexius de László (1869–1937) - James Jeans (1877–1946) - RS.9543 - Royal Society.jpg",
  note: "English physicist and astronomer (1877-1946) whose writings on the cosmos are quoted.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/James_Jeans" }]
  },   {
  id: "younghusband",
  label: "Sir Francis Younghusband",
  terms: ["Younghusband", "Sir Francis Younghusband", "Francis Younghusband"],
  image: "Francis Younghusband 1905.jpg",
  note: "British explorer (1863-1942) of the Himalaya and Tibet.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Francis_Younghusband" }]
  },   {
  id: "lauder",
  label: "Sir Harry Lauder",
  terms: ["Harry Lauder", "Sir Harry Lauder", "Lauder"],
  image: "Harry Lauder, Scotch singer (SAYRE 5898).jpg",
  note: "Beloved Scottish music-hall entertainer (1870-1950).",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Harry_Lauder" }]
  },   {
  id: "mirabehn",
  label: "Madeleine Slade",
  terms: ["Madeleine Slade", "Miss Slade", "Mirabehn"],
  image: "Mahatma Gandhi with Madeleine Slade aboard the S.S. Rajputana (cropped).jpg",
  note: "Madeleine Slade (1892-1982), Gandhi's English disciple known as Mirabehn.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Madeleine_Slade" }]
  },   {
  id: "desai",
  label: "Mahadev Desai",
  terms: ["Mahadev Desai", "Mr. Desai", "Desai"],
  image: "Mahadev Desai 1983 stamp of India.jpg",
  note: "Mahadev Desai (1892-1942), Gandhi's devoted secretary.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mahadev_Desai" }]
  },   {
  id: "alexander",
  label: "Alexander",
  terms: ["Alexander the Great", "Alexander"],
  image: "Bust of Alexander the Great.jpg",
  note: "Alexander the Great (356-323 BC), the Macedonian conqueror mentioned in the book's historical accounts.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Alexander_the_Great" }]
  },   {
  id: "elijah",
  label: "Elijah",
  terms: ["Elijah"],
  image: "The Prophet Ilyas (Elijah In Islam).png",
  note: "The Hebrew prophet; the book compares his departure to a yogi's mahasamadhi.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Elijah" }]
  },   {
  id: "kasturba_gandhi",
  label: "Mrs. Gandhi (Kasturba)",
  terms: ["Mrs. Gandhi"],
  image: "Kasturba Gandhi reading.jpg",
  note: "Kasturba Gandhi, wife of Mahatma Gandhi.",
  links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kasturba_Gandhi" }]
  },   {
  id: "kebalananda",
  label: "Swami Kebalananda",
  terms: ["Kebalananda", "Kebelananda", "Swami Kebalananda"],
  image: null,
  note: "A Sanskrit scholar-disciple of Lahiri Mahasaya who taught Yogananda Sanskrit.",
  links: []
  },   {
  id: "keshabananda",
  label: "Swami Keshabananda",
  terms: ["Keshabananda", "Swami Keshabananda"],
  image: null,
  note: "A saintly yogi of the Brindaban region visited by Yogananda.",
  links: []
  },   {
  id: "premananda",
  label: "Swami Premananda",
  terms: ["Premananda", "Swami Premananda"],
  image: null,
  note: "One of Yogananda's early western disciples.",
  links: []
  },   {
  id: "satyananda",
  label: "Swami Satyananda",
  terms: ["Satyananda", "Swami Satyananda"],
  image: null,
  note: "A disciple of Lahiri Mahasaya encountered on Yogananda's travels.",
  links: []
  },   {
  id: "sebananda",
  label: "Swami Sebananda",
  terms: ["Sebananda", "Swami Sebananda"],
  image: null,
  note: "A sadhu met during Yogananda's journeys.",
  links: []
  },   {
  id: "benoyananda",
  label: "Swami Benoyananda",
  terms: ["Benoyananda", "Swami Benoyananda"],
  image: null,
  note: "A sadhu mentioned in the book.",
  links: []
  },   {
  id: "jitendra",
  label: "Jitendra",
  terms: ["Jitendra"],
  image: null,
  note: "One of the young students of Yogananda's Ranchi school.",
  links: []
  },   {
  id: "wright",
  label: "Wright",
  terms: ["Wright", "Mr. Wright"],
  image: null,
  note: "An American disciple who assisted Yogananda in his western years.",
  links: []
  },   {
  id: "dickinson",
  label: "Dickinson",
  terms: ["Dickinson", "Mr. Dickinson"],
  image: null,
  note: "Dickinson ('Dick'), a western student in Yogananda's circle.",
  links: []
  },   {
  id: "romesh",
  label: "Romesh",
  terms: ["Romesh"],
  image: null,
  note: "A student mentioned in the Ranchi school chapters.",
  links: []
  },   {
  id: "amar",
  label: "Amar",
  terms: ["Amar"],
  image: null,
  note: "One of the boys of Yogananda's Ranchi school.",
  links: []
  },   {
  id: "dijen",
  label: "Dijen",
  terms: ["Dijen"],
  image: null,
  note: "A student of the Ranchi school.",
  links: []
  },   {
  id: "satish",
  label: "Satish",
  terms: ["Satish"],
  image: null,
  note: "A pupil of the Ranchi school.",
  links: []
  },   {
  id: "auddy",
  label: "Auddy",
  terms: ["Auddy"],
  image: null,
  note: "A Calcutta medical student acquainted with Yogananda.",
  links: []
  },   {
  id: "kanai",
  label: "Kanai",
  terms: ["Kanai"],
  image: null,
  note: "One of the young students of the Ranchi school.",
  links: []
  },   {
  id: "jatinda",
  label: "Jatinda",
  terms: ["Jatinda"],
  image: null,
  note: "A person met during Yogananda's travels.",
  links: []
  },   {
  id: "gyanamata",
  label: "Sister Gyanamata",
  terms: ["Gyanamata", "Sister Gyanamata"],
  image: null,
  note: "A monastic disciple in the Self-Realization Fellowship.",
  links: []
  },   {
  id: "yogmata",
  label: "Sister Yogmata",
  terms: ["Yogmata", "Sister Yogmata"],
  image: null,
  note: "A monastic disciple in the Self-Realization Fellowship.",
  links: []
  },   {
  id: "bletch",
  label: "Ettie Bletch",
  terms: ["Ettie Bletch", "Miss Bletch", "Bletch"],
  image: null,
  note: "An American woman who witnessed Therese Neumann's phenomena.",
  links: []
  },   {
  id: "ruth_zahn",
  label: "Ruth Zahn",
  terms: ["Ruth Zahn"],
  image: null,
  note: "An American devotee of the Los Angeles center.",
  links: []
  },   {
  id: "fritz_gerlick",
  label: "Fritz Gerlick",
  terms: ["Fritz Gerlick", "Dr. Fritz Gerlick"],
  image: null,
  note: "A devotee met on Yogananda's European journey.",
  links: []
  },   {
  id: "ghoshal",
  label: "Dr. Ghoshal",
  terms: ["Dr. Ghoshal", "Ghoshal"],
  image: null,
  note: "A physician in the Calcutta circle.",
  links: []
  },   {
  id: "mwlewis",
  label: "Dr. Lewis",
  terms: ["Dr. Lewis"],
  image: null,
  note: "A disciple who served the Fellowship's western work.",
  links: []
  },   {
  id: "lloyd_kennell",
  label: "Lloyd Kennell",
  terms: ["Lloyd Kennell"],
  image: null,
  note: "An American disciple.",
  links: []
  },   {
  id: "misra",
  label: "Dr. Misra",
  terms: ["Dr. Misra", "Misra"],
  image: null,
  note: "A devotee in the Benares circle.",
  links: []
  },   {
  id: "narayan_chunder",
  label: "Dr. Narayan Chunder",
  terms: ["Narayan Chunder", "Dr. Narayan Chunder"],
  image: null,
  note: "A Bengali gentleman of the book.",
  links: []
  },   {
  id: "pingale",
  label: "Dr. Pingale",
  terms: ["Dr. Pingale", "Pingale"],
  image: null,
  note: "A devotee mentioned in the book.",
  links: []
  },   {
  id: "wurz",
  label: "Dr. Wurz",
  terms: ["Dr. Wurz", "Wurz"],
  image: null,
  note: "A person met during the European travels.",
  links: []
  },   {
  id: "iswari_narayan",
  label: "Maharaja Iswari Narayan",
  terms: ["Iswari Narayan", "Maharaja Iswari Narayan"],
  image: null,
  note: "An Indian prince encountered in the book.",
  links: []
  },   {
  id: "jotindra_mohan",
  label: "Maharaja Jotindra Mohan",
  terms: ["Jotindra Mohan", "Maharaja Jotindra Mohan"],
  image: null,
  note: "An Indian maharaja mentioned in the book.",
  links: []
  },   {
  id: "humayun",
  label: "Prince Humayun",
  terms: ["Prince Humayun"],
  image: null,
  note: "An Indian prince met during a journey.",
  links: []
  },   {
  id: "manindra_chandra",
  label: "Sir Manindra Chandra",
  terms: ["Manindra Chandra", "Sir Manindra Chandra"],
  image: null,
  note: "A Bengali notable mentioned in the book.",
  links: []
  },   {
  id: "bhaskarananda",
  label: "Swami Bhaskarananda",
  terms: ["Vhaskarananda Saraswati", "Bhaskarananda"],
  image: null,
  note: "A wandering swami mentioned in the book.",
  links: []
  },   {
  id: "hunsicker",
  label: "Mr. Hunsicker",
  terms: ["Hunsicker", "Mr. Hunsicker"],
  image: null,
  note: "A supporter met on the American journey.",
  links: []
  }
];
