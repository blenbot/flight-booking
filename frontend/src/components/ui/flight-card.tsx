import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flight } from "@/types/flights";

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
}

export function FlightCard({ flight, onBook }: FlightCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {flight.airline_name} - {flight.flight_number}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><span className="font-medium">From:</span> {flight.source}</p>
          <p><span className="font-medium">To:</span> {flight.destination}</p>
          <p><span className="font-medium">Departure:</span> {formatDate(flight.departure_time)}</p>
          <p><span className="font-medium">Price:</span> ${flight.price}</p>
          <p><span className="font-medium">Available Seats:</span> {flight.available_seats}</p>
          <Button 
            className="w-full mt-4" 
            onClick={() => onBook(flight)}
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}