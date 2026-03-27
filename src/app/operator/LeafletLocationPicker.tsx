"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface LeafletLocationPickerProps {
    lat: number;
    lng: number;
    onSelect: (lat: number, lng: number) => void;
}

export default function LeafletLocationPicker({ lat, lng, onSelect }: LeafletLocationPickerProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.CircleMarker | null>(null);
    const onSelectRef = useRef(onSelect);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || mapRef.current) return;

        const map = L.map(container, {
            center: [lat, lng],
            zoom: 14,
            minZoom: 11,
            maxZoom: 19,
            scrollWheelZoom: true,
            dragging: true,
            doubleClickZoom: true,
            touchZoom: true,
            boxZoom: true,
            keyboard: true,
            maxBounds: [
                [45.42, -73.9],
                [45.72, -73.35],
            ],
            maxBoundsViscosity: 0.8,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const marker = L.circleMarker([lat, lng], {
            radius: 9,
            color: "#8b5cf6",
            weight: 3,
            fillColor: "#a78bfa",
            fillOpacity: 0.95,
        }).addTo(map);

        map.on("click", (event: L.LeafletMouseEvent) => {
            marker.setLatLng(event.latlng);
            onSelectRef.current(event.latlng.lat, event.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Ensure Leaflet recalculates tile/pan bounds after layout changes.
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize({ animate: false });
        });
        resizeObserver.observe(container);

        const onWindowResize = () => map.invalidateSize({ animate: false });
        window.addEventListener("resize", onWindowResize);

        requestAnimationFrame(() => map.invalidateSize({ animate: false }));

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", onWindowResize);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;

        const position = L.latLng(lat, lng);
        marker.setLatLng(position);
        map.panTo(position, { animate: true, duration: 0.35 });
    }, [lat, lng]);

    return <div ref={containerRef} className="h-full w-full" />;
}
