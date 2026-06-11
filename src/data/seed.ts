import { Project, ProjectDocument, Submittal } from "../types";

/**
 * Seeded mock data for the demo API. Fictional project document management
 * data in the style of an AEC project information platform. No real data.
 */

export const projects: Project[] = [
  { id: "PRJ-1001", name: "Riverside Medical Center Expansion", number: "2024-118" },
  { id: "PRJ-1002", name: "Harbor Point Transit Hub", number: "2025-031" }
];

export const documents: ProjectDocument[] = [
  {
    id: "DOC-9001",
    projectId: "PRJ-1001",
    title: "Level 3 Mechanical Floor Plan",
    discipline: "Mechanical",
    status: "Issued for Review",
    revision: "C",
    fileName: "M-301_Level3_Mechanical_Plan_RevC.pdf",
    author: "J. Okafor",
    updatedAt: "2026-05-28T14:32:00.000Z"
  },
  {
    id: "DOC-9002",
    projectId: "PRJ-1001",
    title: "Curtain Wall Details - North Elevation",
    discipline: "Architectural",
    status: "Approved",
    revision: "B",
    fileName: "A-541_CurtainWall_North_RevB.pdf",
    author: "M. Lindqvist",
    updatedAt: "2026-05-21T09:15:00.000Z"
  },
  {
    id: "DOC-9003",
    projectId: "PRJ-1001",
    title: "Structural Steel Connection Schedule",
    discipline: "Structural",
    status: "Draft",
    revision: "A",
    fileName: "S-202_Steel_Connections_RevA.pdf",
    author: "R. Patel",
    updatedAt: "2026-06-02T16:48:00.000Z"
  },
  {
    id: "DOC-9004",
    projectId: "PRJ-1001",
    title: "Operating Room HVAC Sequence of Operations",
    discipline: "Mechanical",
    status: "Issued for Review",
    revision: "A",
    fileName: "M-601_OR_HVAC_SOO_RevA.pdf",
    author: "J. Okafor",
    updatedAt: "2026-06-05T11:05:00.000Z"
  },
  {
    id: "DOC-9101",
    projectId: "PRJ-1002",
    title: "Platform Canopy Framing Plan",
    discipline: "Structural",
    status: "Draft",
    revision: "A",
    fileName: "S-110_Canopy_Framing_RevA.pdf",
    author: "T. Nguyen",
    updatedAt: "2026-06-01T13:20:00.000Z"
  }
];

export const submittals: Submittal[] = [
  {
    id: "SUB-7001",
    projectId: "PRJ-1001",
    title: "Air Handling Unit Product Data - AHU-3",
    discipline: "Mechanical",
    specSection: "23 73 13",
    status: "Under Review",
    revision: "1",
    dueDate: "2026-06-20",
    reviewer: "K. Demers",
    submittedBy: "Summit Mechanical Contractors",
    createdAt: "2026-06-03T15:10:00.000Z"
  },
  {
    id: "SUB-7002",
    projectId: "PRJ-1001",
    title: "Curtain Wall Shop Drawings - North Elevation",
    discipline: "Architectural",
    specSection: "08 44 13",
    status: "Open",
    revision: "1",
    dueDate: "2026-06-27",
    reviewer: "M. Lindqvist",
    submittedBy: "Apex Glazing Systems",
    createdAt: "2026-06-06T10:42:00.000Z"
  }
];

let submittalSequence = 7003;

export function nextSubmittalId(): string {
  return `SUB-${submittalSequence++}`;
}
