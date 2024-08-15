export const requests = [
    {
        id: '01',
        fullName: 'Джатдоев Алим Сеит-Алиевич',
        post: 'КВС',
        date: '2024-05-17',
        aviacompany: 'Азимут',
        aviacompany_icon: 'azimut_preview.png',
        airport: 'MRV',
        arrival_title: 'РС№0024358',
        arrival_date: '17.05.2024',
        arrival_time: '13:50',
        departure_title: 'РС№002435',
        departure_date: '19.06.2024',
        departure_time: '14:50',
        status: 'В обработке',
        statusCode: 'processing',
    },
    {
        id: '02',
        fullName: 'Гочияев Руслан Романович',
        post: 'КВС',
        date: '2024-05-18',
        aviacompany: 'S7 airlines',
        aviacompany_icon: 'S7-airlines-preview.png',
        airport: 'MRV',
        arrival_title: 'РС№002435',
        arrival_date: '17.05.2024',
        arrival_time: '13:50',
        departure_title: 'РС№002435',
        departure_date: '17.05.2024',
        departure_time: '13:50',
        status: 'Отменен',
        statusCode: 'cancelled',
    },
    {
        id: '03',
        fullName: 'Уртенов Азамат Заурович',
        post: 'КВС',
        date: '2024-05-18',
        aviacompany: 'Северный ветер',
        aviacompany_icon: 'Северный-ветер-preview.png',
        airport: 'MRV',
        arrival_title: 'РС№002435',
        arrival_date: '17.05.2024',
        arrival_time: '13:50',
        departure_title: 'РС№002435',
        departure_date: '17.05.2024',
        departure_time: '13:50',
        status: 'Готово',
        statusCode: 'done',
    },
]

export const requestsReserve = [
    {
        id: '01',
        date: '2024-05-27',
        aviacompany: 'Азимут',
        aviacompany_icon: 'azimut_preview.png',
        airport: 'MRV',
        arrival_title: 'РС№0024358',
        arrival_date: '2024-07-17',
        arrival_time: '13:50',
        departure_title: 'РС№002435',
        departure_date: '2024-07-19',
        departure_time: '14:50',
        status: 'В обработке',
        statusCode: 'processing',
        passengers: [
            {
                client: 'Каппушев Мухаммад Расулович',
                sex: 'Мужской',
                phone: '8 909 000 00 00',
                start: '2024-07-17',
                startTime: '13:50',
                end: '2024-07-19',
                endTime: '14:50',
                room: '',
                place: '',
                public: false,
            },
            {
                client: 'Иванов Иван Иванович',
                sex: 'Мужской',
                phone: '8 909 000 00 00',
                start: '2024-07-17',
                startTime: '13:50',
                end: '2024-07-19',
                endTime: '14:50',
                room: '',
                place: '',
                public: false,
            }
        ]
    },
    {
        id: '02',
        date: '2024-05-28',
        aviacompany: 'S7 airlines',
        aviacompany_icon: 'S7-airlines-preview.png',
        airport: 'MRV',
        arrival_title: 'РС№0024358',
        arrival_date: '2024-07-17',
        arrival_time: '13:50',
        departure_title: 'РС№002435',
        departure_date: '2024-07-19',
        departure_time: '14:50',
        status: 'Отменен',
        statusCode: 'cancelled',
        passengers: []
    },
    {
        id: '03',
        date: '2024-05-28',
        aviacompany: 'Северный ветер',
        aviacompany_icon: 'Северный-ветер-preview.png',
        airport: 'MRV',
        arrival_title: 'РС№0024358',
        arrival_date: '2024-07-17',
        arrival_time: '13:50',
        departure_title: 'РС№002435',
        departure_date: '2024-07-19',
        departure_time: '14:50',
        status: 'Готово',
        statusCode: 'done',
        passengers: []
    },
]

export const requestsCompany = [
    {
        avatar: 'avatar.png',
        fio: 'Уртенов Азамат Заурович',
        post: 'Администратор',
        login: 'login',
        password: 'password'
    },
    {
        avatar: 'avatar1.png',
        fio: 'Иванов Иван Иванович',
        post: 'Модератор',
        login: 'login',
        password: 'password'
    },
]

export const requestsReports = [
    {
        airline: 'Азимут',
        airlineImg: 'azimut_preview.png',
        dateFormirovania: '2024-08-15',
        startDate: '2024-07-15',
        endDate: '2024-08-15'
    }
]

export const requestsHotels = [
    {
        hotelImage: 'hotelImage.png',
        hotelCountry: 'Россия',
        hotelName: 'Гостиница “Славянка”',
        hotelCity: 'Москва',
        hotelAdress: 'ул. Лесная  147',
        hotelKvota: '24',
        hotelIndex: '119180',
        hotelEmail: 'example@gmail.com',
        hotelPhone: '0 000 000 00 00',
        hotelInn: '772470642050',
        hotelOgrn: '315774600021240',
        hotelRs: '40802810600000031447',
        hotelBank: 'филиал №7701 банка ВТБ 24 (ПАО) г. Москва',
        hotelBik: '30102810345250000745'
    },
]

export const requestsTarifs = [
    {
        tarifName: "ЭКОНОМ",
        tarif_сategory_one_place: "3000",
        tarif_сategory_two_place: "4000",
        tarif_сategory_three_place: "5000",
        tarif_airline_one_place: "3000",
        tarif_airline_two_place: "4000",
        tarif_airline_three_place: "5000"
    },
    {
        tarifName: "ЛЮКС",
        tarif_сategory_one_place: "6000",
        tarif_сategory_two_place: "7000",
        tarif_сategory_three_place: "8000",
        tarif_airline_one_place: "3000",
        tarif_airline_two_place: "4000",
        tarif_airline_three_place: "5000"
    }
]

export const requestsNomerFond = [
    {
        type: '1',
        numbers: ['№ 150', '№ 151']
    },
    {
        type: '2',
        numbers: ['№ 250', '№ 251']
    },
    {
        type: '3',
        numbers: ['№ 350', '№ 351']
    },
]

export const requestsCompanyHotel = [
    {
        avatar: 'avatar.png',
        fio: 'Иванов Иван',
        post: 'Администратор',
        login: 'login',
        password: 'password'
    },
    {
        avatar: 'avatar1.png',
        fio: 'Коротковский Евгений',
        post: 'Модератор',
        login: 'login',
        password: 'password'
    },
]

export const requestsAirlanes = [
    {
        airlineImage: 'azimut_preview.png',
        airlineCountry: 'Россия',
        airlineName: 'Азимут',
        airlineCity: 'Москва',
        airlineAdress: 'ул. Лесная  147',
        airlineKvota: '24',
        airlineIndex: '119180',
        airlineEmail: 'example@gmail.com',
        airlinePhone: '0 000 000 00 00',
        airlineInn: '772470642050',
        airlineOgrn: '315774600021240',
        airlineRs: '40802810600000031447',
        airlineBank: 'филиал №7701 банка ВТБ 24 (ПАО) г. Москва',
        airlineBik: '30102810345250000745'
    },
]

export const requestsAirlinesCompany = [
    {
        type: 'Отдел планирования',
        numbers: [
            {
                avatar: 'avatar.png',
                fio: 'Уртенов Азамат Заурович',
                post: 'Администратор',
                login: 'login1',
                password: 'password'
            },
            {
                avatar: 'avatar1.png',
                fio: 'Иванов Иван Иванович',
                post: 'Модератор',
                login: 'login2',
                password: 'password'
            }
        ]
    },
    {
        type: 'Отдел кадров',
        numbers: [
            {
                avatar: 'avatar.png',
                fio: 'Иванов Иван Иванович',
                post: 'Модератор',
                login: 'login3',
                password: 'password'
            },
            {
                avatar: 'avatar1.png',
                fio: 'Уртенов Азамат Заурович',
                post: 'Администратор',
                login: 'login4',
                password: 'password'
            },
        ]
    },
]