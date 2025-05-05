class Server {
    constructor(public version: string, public title: string, public strapline: string = "...", public url: string = "http://localhost") {}
}

class Limits {
    constructor(public limitdefault: number = 20, public limitmax: number = 20) {}
}

class Registration {
    constructor(public available: boolean = true, public open: boolean = true) {}
}

class Search {
    constructor(public id: string = "search", public available: boolean = true, public supportedParams: string[] = ["q"]) {}
}

class Category {
    constructor(public id: number, public name: string, public subcategories: Category[] = []) {}
}

abstract class CapsBase {
    constructor(public server: Server, public limits: Limits, public registration: Registration, public searching: Search[], public categories: Category[]) {}
}

export { Server, Limits, Registration, Search, Category, CapsBase };
