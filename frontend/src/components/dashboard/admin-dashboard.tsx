import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { Menu, Users, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Flight, NewFlight } from "@/types/admin";

interface FlightCardProps {
  flight: Flight;
  onEditClick: (flight: Flight) => void;
}

const FlightCard = ({ flight, onEditClick }: FlightCardProps) => {
  return (
    <Card>
      <CardContent className="grid grid-cols-4 gap-6 p-6 items-center">
        <div className="space-y-2">
          <div className="font-semibold text-lg">{flight.airline_name}</div>
          <div className="text-sm text-gray-500">
            {flight.source} → {flight.destination}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">Departure:</div>
          <div className="text-sm">{new Date(flight.departure_time).toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-2">Arrival:</div>
          <div className="text-sm">{new Date(flight.arrival_time).toLocaleString()}</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500">Available Seats:</div>
          <div className="text-sm">{flight.available_seats}/{flight.total_seats}</div>
          <div className="font-medium">Price: ${flight.price}</div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onEditClick(flight)}>Update</Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface PaginatedResponse {
  flights: Flight[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string | null>(null);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [newFlight, setNewFlight] = useState<NewFlight>({
    airline_name: "",
    source: "",
    destination: "",
    departure_time: "",
    arrival_time: "",
    total_seats: 0,
    available_seats: 0,
    price: 0,
    status: 'scheduled'
  });
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/v1/flights?page=${currentPage}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch flights");
      }

      const data: PaginatedResponse = await response.json();
      console.log("Flights data:", data);

      // Update state with paginated data
      setFlights(data.flights);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [currentPage]);

  // Update fetchUsers with better error handling
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Fetching users...");

      const response = await fetch("http://localhost:5000/api/v1/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      console.log("Users fetched:", data);
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlight = async () => {
    try {
      const body = {
        ...newFlight,
        departure_time: formatDateForAPI(newFlight.departure_time),
        arrival_time:   formatDateForAPI(newFlight.arrival_time)
      }

      const response = await fetch(
        "http://localhost:5000/api/v1/admin/flights",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(body)
        }
      )

      if (!response.ok) throw new Error("Failed to add flight");
      
      setShowAddFlight(false);
      fetchFlights();
      setNewFlight({
        airline_name: "",
        source: "",
        destination: "",
        departure_time: "",
        arrival_time: "",
        total_seats: 0,
        available_seats: 0,
        price: 0,
        status: 'scheduled'
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to add flight");
    }
  };

  const formatDateForAPI = (date: string) => {
    return new Date(date).toISOString()
  }

  const handleUpdateFlight = async (flightId: number, updatedFlight: Flight) => {
    try {
      const body = {
        airline_name:   updatedFlight.airline_name,
        source:         updatedFlight.source,
        destination:    updatedFlight.destination,
        departure_time: formatDateForAPI(updatedFlight.departure_time),
        arrival_time:   formatDateForAPI(updatedFlight.arrival_time),
        total_seats:    updatedFlight.total_seats,
        available_seats:updatedFlight.available_seats,
        price:          updatedFlight.price,
        status:         updatedFlight.status || "scheduled"
      }

      const response = await fetch(
        `http://localhost:5000/api/v1/admin/flights/${flightId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(body)
        }
      )

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update flight');
      }

      setEditingFlight(null);
      fetchFlights();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update flight');
    }
  };

  const handleDeleteFlight = async (flightId: number) => {
    if (!confirm("Are you sure you want to delete this flight?")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/admin/flights/${flightId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete flight");
      fetchFlights();
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to delete flight");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
  
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-400 shadow-sm py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]">
              <Button 
                variant="destructive"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-sm bg-red-500 hover:bg-red-600"
                onClick={() => (document.querySelector('button[data-state="open"]') as HTMLButtonElement)?.click()}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
              <div className="flex flex-col gap-4 mt-8">
                <Button 
                  variant="ghost" 
                  className="justify-start w-full text-black hover:bg-gray-100" 
                  onClick={() => setShowUsers(false)}
                >
                  <Menu className="mr-2 h-4 w-4 text-black" />
                  <span className="text-black">Manage Flights</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start w-full text-black hover:bg-gray-100" 
                  onClick={() => {
                    setShowUsers(true);
                    fetchUsers();
                  }}
                >
                  <Users className="mr-2 h-4 w-4 text-black" />
                  <span className="text-black">Manage Users</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Aerocheck Admin
          </h1>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="border-red-500 hover:bg-red-500 hover:text-white text-red-500"
        >
          Logout
        </Button>
      </nav>

      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <img 
            src="https://img.freepik.com/premium-vector/waving-hand-icon-yellow-gesture-emoji-vector-illustration_212216-1030.jpg"
            alt="Waving hand"
            className="w-10 h-10 rounded-full"
          />
          <h2 className="text-2xl font-semibold text-black">
            Welcome, {user?.name || 'Admin'}!
          </h2>
        </div>

        {!showUsers ? (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Flights</CardTitle>
              <Button onClick={() => setShowAddFlight(true)}>Add New Flight</Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : flights.length > 0 ? (
                    <>
                      {flights.map((flight) => (
                        <FlightCard 
                          key={flight.flight_id} 
                          flight={flight} 
                          onEditClick={setEditingFlight}
                        />
                      ))}
                      <div className="flex justify-center gap-2 mt-4">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <Button
                            key={i + 1}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No flights available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="grid gap-4">
                  {loading ? (
                    <div className="text-center py-4">Loading users...</div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="flex justify-between items-center p-6">
                          <div className="grid grid-cols-4 gap-8 w-full items-center">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Name:</span>
                              <span>{user.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Email:</span>
                              <span className="text-gray-600">{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Role:</span>
                              <span className="capitalize text-gray-600">{user.role}</span>
                            </div>
                            {user.role !== 'admin' && (
                              <Button 
                                variant="destructive"
                                size="sm"
                                className="ml-auto"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete User
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Flight Dialog */}
      <Dialog open={showAddFlight} onOpenChange={setShowAddFlight}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Flight</DialogTitle>
            <DialogDescription>
              Enter the details for the new flight
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Airline Name</label>
              <Input
                className="text-black"
                value={newFlight.airline_name}
                onChange={(e) => setNewFlight({...newFlight, airline_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">From</label>
              <Input
                className="text-black"
                value={newFlight.source}
                onChange={(e) => setNewFlight({...newFlight, source: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">To</label>
              <Input
                className="text-black"
                value={newFlight.destination}
                onChange={(e) => setNewFlight({...newFlight, destination: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Departure Time</label>
              <Input
                type="datetime-local"
                className="text-black"
                value={newFlight.departure_time}
                onChange={(e) => setNewFlight({...newFlight, departure_time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Arrival Time</label>
              <Input
                type="datetime-local"
                className="text-black"
                value={newFlight.arrival_time}
                onChange={(e) => setNewFlight({...newFlight, arrival_time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Total Seats</label>
              <Input
                type="number"
                className="text-black"
                value={newFlight.total_seats}
                onChange={(e) => setNewFlight({...newFlight, total_seats: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Price ($)</label>
              <Input
                type="number"
                className="text-black"
                value={newFlight.price}
                onChange={(e) => setNewFlight({...newFlight, price: parseFloat(e.target.value)})}
              />
            </div>
            <Button onClick={handleAddFlight} className="w-full">
              Add Flight
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Flight Dialog */}
      <Dialog open={!!editingFlight} onOpenChange={() => setEditingFlight(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flight</DialogTitle>
            <DialogDescription>
              Modify flight details
            </DialogDescription>
          </DialogHeader>
          {editingFlight && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Airline Name</label>
                <Input
                  className="text-black"
                  value={editingFlight.airline_name}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    airline_name: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Source</label>
                <Input
                  className="text-black"
                  value={editingFlight.source}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    source: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Destination</label>
                <Input
                  className="text-black"
                  value={editingFlight.destination}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    destination: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Departure Time</label>
                <Input
                  type="datetime-local"
                  className="text-black"
                  value={editingFlight.departure_time}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    departure_time: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Arrival Time</label>
                <Input
                  type="datetime-local"
                  className="text-black"
                  value={editingFlight.arrival_time}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    arrival_time: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Price ($)</label>
                <Input
                  type="number"
                  className="text-black"
                  value={editingFlight.price}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    price: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Available Seats</label>
                <Input
                  type="number"
                  className="text-black"
                  value={editingFlight.available_seats}
                  onChange={(e) => setEditingFlight({
                    ...editingFlight,
                    available_seats: parseInt(e.target.value)
                  })}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    if (editingFlight) {
                      handleUpdateFlight(editingFlight.flight_id, editingFlight);
                    }
                  }}
                >
                  Update Flight
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteFlight(editingFlight.flight_id)}
                >
                  Delete Flight
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}