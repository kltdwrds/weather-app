import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders learn react link", () => {
  render(<App />);
  const linkElement = screen.getByText(/Your Cities/i);
  expect(linkElement).toBeInTheDocument();
  const linkElement2 = screen.getByText(/Weather Dashboard/i);
  expect(linkElement2).toBeInTheDocument();
  const linkElement3 = screen.getByText(/Add a City/i);
  expect(linkElement3).toBeInTheDocument();
});
