export interface Flight {
    id: number;
    flight_number: string;
    departure: string;
    arrival: string;
    date: string;
    price: number;
    available_seats: number;
    created_at: string;
    updated_at: string;
}

export interface AdminDashboardProps {
    flights: Flight[]; // List of flights
    onAddFlight: (flight: Flight) => void; // Callback for adding a flight
    onDeleteFlight: (flightId: string) => void; // Callback for deleting a flight
}