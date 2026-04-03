import React from "react";
import { useParams } from "react-router-dom";
import NoApiPlaceholder from "./NoApiPlaceholder";

export default function AddEditNoApiPlaceholder({ addTitle, editTitle, subtitle }) {
  const params = useParams();
  const hasId = params?.id != null;

  return (
    <NoApiPlaceholder
      title={hasId ? editTitle : addTitle}
      subtitle={subtitle}
    />
  );
}

