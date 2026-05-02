import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GameBoard, type Station } from "./GameBoard";

const mockStations: Station[] = [
  { id: "s1", title: "Station 1", emoji: "🗳️", caption: "Ready" },
  { id: "s2", title: "Station 2", emoji: "🆔", caption: "Verify" },
  { id: "s3", title: "Station 3", emoji: "📍", caption: "Find" },
];

describe("GameBoard", () => {
  it("renders all stations", () => {
    render(
      <GameBoard
        stations={mockStations}
        activeId="s1"
        completed={new Set()}
        onSelect={vi.fn()}
      />
    );
    
    expect(screen.getByText("Station 1")).toBeInTheDocument();
    expect(screen.getByText("Station 2")).toBeInTheDocument();
    expect(screen.getByText("Station 3")).toBeInTheDocument();
  });

  it("calls onSelect when a station is clicked", () => {
    const onSelect = vi.fn();
    render(
      <GameBoard
        stations={mockStations}
        activeId="s1"
        completed={new Set()}
        onSelect={onSelect}
      />
    );
    
    fireEvent.click(screen.getByLabelText(/Station 2/));
    expect(onSelect).toHaveBeenCalledWith("s2");
  });

  it("identifies active station", () => {
    render(
      <GameBoard
        stations={mockStations}
        activeId="s1"
        completed={new Set()}
        onSelect={vi.fn()}
      />
    );
    
    expect(screen.getByLabelText(/Current step/)).toBeInTheDocument();
  });

  it("identifies completed station", () => {
    render(
      <GameBoard
        stations={mockStations}
        activeId="s2"
        completed={new Set(["s1"])}
        onSelect={vi.fn()}
      />
    );
    
    expect(screen.getByLabelText(/Completed/)).toBeInTheDocument();
  });

  it("identifies locked station", () => {
    render(
      <GameBoard
        stations={mockStations}
        activeId="s1"
        completed={new Set()}
        onSelect={vi.fn()}
      />
    );
    
    expect(screen.getAllByLabelText(/Locked/)).toHaveLength(2);
  });
});
