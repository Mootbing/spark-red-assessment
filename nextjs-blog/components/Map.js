import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import FriendInfoWindow from './FriendInfoWindow';
import styles from '../styles/Map.module.css';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  marginTop: '2rem',
  borderRadius: '12px',
};

const center = {
  lat: 39.9529, // Default center (Philadelphia)
  lng: -75.1910,
};

export default function Map({ friends, selectedFriend, setSelectedFriend }) {
  return (
    <LoadScript googleMapsApiKey="AIzaSyAByQ8xOI-JOL1z6_K4zsHZcdVTtFHwFH0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
      >
        {friends.map((friend) => (
          <Marker
            key={friend.id}
            position={friend.position}
            onClick={() => setSelectedFriend(friend)}
          />
        ))}

        {selectedFriend && (
          <FriendInfoWindow 
            friend={selectedFriend} 
            onClose={() => setSelectedFriend(null)} 
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
} 