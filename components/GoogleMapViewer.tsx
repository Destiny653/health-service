// src/components/GoogleMapViewer.tsx
'use client';

interface GoogleMapViewerProps {
  address: string;
  facilityName: string;
  apiKey: string;
}

export default function GoogleMapViewer({ address, facilityName, apiKey }: GoogleMapViewerProps) {
  const encodedAddress = encodeURIComponent(`${facilityName}, ${address}, Cameroon`);
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        title={`Map of ${facilityName}`}
      />
    </div>
  );
}