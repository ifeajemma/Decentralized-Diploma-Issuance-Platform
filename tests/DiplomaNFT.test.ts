import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV, optionalCV, buffCV, listCV, principalCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_ALREADY_MINTED = 101;
const ERR_INVALID_ID = 102;
const ERR_INVALID_DEGREE_TYPE = 103;
const ERR_INVALID_GPA = 104;
const ERR_INVALID_GRAD_DATE = 105;
const ERR_INVALID_HONORS = 106;
const ERR_INVALID_MAJOR = 107;
const ERR_INVALID_MINOR = 108;
const ERR_INVALID_TRANSCRIPT_HASH = 109;
const ERR_REVOKED = 110;
const ERR_NOT_OWNER = 111;
const ERR_INVALID_METADATA = 112;
const ERR_MAX_DIPLOMAS_EXCEEDED = 113;
const ERR_INVALID_UPDATE_PARAM = 114;
const ERR_UPDATE_NOT_ALLOWED = 115;
const ERR_INVALID_ISSUER = 116;
const ERR_INVALID_RECIPIENT = 117;
const ERR_INVALID_STATUS = 118;
const ERR_AUTHORITY_NOT_VERIFIED = 119;
const ERR_INVALID_FIELD_OF_STUDY = 120;
const ERR_INVALID_CREDIT_HOURS = 121;
const ERR_INVALID_THESIS_TITLE = 122;
const ERR_INVALID_ADVISOR = 123;
const ERR_INVALID_AWARDS = 124;
const ERR_INVALID_VERIFICATION_LEVEL = 125;

interface DiplomaMetadata {
  university: string;
  degreeType: string;
  gpa: number;
  graduationDate: number;
  honors: string;
  major: string;
  minor: string | null;
  transcriptHash: Uint8Array;
  status: boolean;
  fieldOfStudy: string;
  creditHours: number;
  thesisTitle: string | null;
  advisor: string | null;
  awards: string[];
  verificationLevel: number;
}

interface DiplomaUpdate {
  updateDegreeType: string;
  updateGpa: number;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class DiplomaNFTMock {
  state: {
    lastTokenId: number;
    maxDiplomas: number;
    mintFee: number;
    authorityContract: string | null;
    diplomaMetadata: Map<number, DiplomaMetadata>;
    diplomaUpdates: Map<number, DiplomaUpdate>;
    nftOwners: Map<number, string>;
  } = {
    lastTokenId: 0,
    maxDiplomas: 1000000,
    mintFee: 500,
    authorityContract: null,
    diplomaMetadata: new Map(),
    diplomaUpdates: new Map(),
    nftOwners: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorizedUniversities: Set<string> = new Set(["ST1TEST"]);
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      lastTokenId: 0,
      maxDiplomas: 1000000,
      mintFee: 500,
      authorityContract: null,
      diplomaMetadata: new Map(),
      diplomaUpdates: new Map(),
      nftOwners: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorizedUniversities = new Set(["ST1TEST"]);
    this.stxTransfers = [];
  }

  isUniversityAuthorized(principal: string): boolean {
    return this.authorizedUniversities.has(principal);
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === this.caller) {
      return { ok: false, value: ERR_NOT_AUTHORIZED };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setMaxDiplomas(newMax: number): Result<boolean> {
    if (newMax <= 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.state.maxDiplomas = newMax;
    return { ok: true, value: true };
  }

  setMintFee(newFee: number): Result<boolean> {
    if (newFee < 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.state.mintFee = newFee;
    return { ok: true, value: true };
  }

  mintDiploma(
    recipient: string,
    degreeType: string,
    gpa: number,
    graduationDate: number,
    honors: string,
    major: string,
    minor: string | null,
    transcriptHash: Uint8Array,
    fieldOfStudy: string,
    creditHours: number,
    thesisTitle: string | null,
    advisor: string | null,
    awards: string[],
    verificationLevel: number
  ): Result<number> {
    if (this.state.lastTokenId >= this.state.maxDiplomas) return { ok: false, value: ERR_MAX_DIPLOMAS_EXCEEDED };
    if (!this.isUniversityAuthorized(this.caller)) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (degreeType.length === 0 || degreeType.length > 50) return { ok: false, value: ERR_INVALID_DEGREE_TYPE };
    if (gpa < 0 || gpa > 400) return { ok: false, value: ERR_INVALID_GPA };
    if (graduationDate <= 0) return { ok: false, value: ERR_INVALID_GRAD_DATE };
    if (honors.length > 50) return { ok: false, value: ERR_INVALID_HONORS };
    if (major.length === 0 || major.length > 100) return { ok: false, value: ERR_INVALID_MAJOR };
    if (minor && minor.length > 100) return { ok: false, value: ERR_INVALID_MINOR };
    if (transcriptHash.length !== 32) return { ok: false, value: ERR_INVALID_TRANSCRIPT_HASH };
    if (fieldOfStudy.length > 100) return { ok: false, value: ERR_INVALID_FIELD_OF_STUDY };
    if (creditHours < 0 || creditHours > 300) return { ok: false, value: ERR_INVALID_CREDIT_HOURS };
    if (thesisTitle && thesisTitle.length > 200) return { ok: false, value: ERR_INVALID_THESIS_TITLE };
    if (awards.length > 5) return { ok: false, value: ERR_INVALID_AWARDS };
    if (verificationLevel > 5) return { ok: false, value: ERR_INVALID_VERIFICATION_LEVEL };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.mintFee, from: this.caller, to: this.state.authorityContract });

    const tokenId = this.state.lastTokenId + 1;
    const metadata: DiplomaMetadata = {
      university: this.caller,
      degreeType,
      gpa,
      graduationDate,
      honors,
      major,
      minor,
      transcriptHash,
      status: true,
      fieldOfStudy,
      creditHours,
      thesisTitle,
      advisor,
      awards,
      verificationLevel,
    };
    this.state.diplomaMetadata.set(tokenId, metadata);
    this.state.nftOwners.set(tokenId, recipient);
    this.state.lastTokenId = tokenId;
    return { ok: true, value: tokenId };
  }

  getDiploma(tokenId: number): DiplomaMetadata | null {
    return this.state.diplomaMetadata.get(tokenId) || null;
  }

  getOwner(tokenId: number): string | null {
    return this.state.nftOwners.get(tokenId) || null;
  }

  transferDiploma(tokenId: number, sender: string, recipient: string): Result<boolean> {
    if (this.caller !== sender) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const owner = this.getOwner(tokenId);
    if (!owner || owner !== sender) return { ok: false, value: ERR_NOT_OWNER };
    this.state.nftOwners.set(tokenId, recipient);
    return { ok: true, value: true };
  }

  burnDiploma(tokenId: number): Result<boolean> {
    const owner = this.getOwner(tokenId);
    if (!owner || owner !== this.caller) return { ok: false, value: ERR_NOT_OWNER };
    this.state.nftOwners.delete(tokenId);
    return { ok: true, value: true };
  }

  updateDiploma(tokenId: number, updateDegreeType: string, updateGpa: number): Result<boolean> {
    const metadata = this.state.diplomaMetadata.get(tokenId);
    if (!metadata) return { ok: false, value: ERR_INVALID_ID };
    if (metadata.university !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!metadata.status) return { ok: false, value: ERR_REVOKED };
    if (updateDegreeType.length === 0 || updateDegreeType.length > 50) return { ok: false, value: ERR_INVALID_DEGREE_TYPE };
    if (updateGpa < 0 || updateGpa > 400) return { ok: false, value: ERR_INVALID_GPA };

    const updated: DiplomaMetadata = {
      ...metadata,
      degreeType: updateDegreeType,
      gpa: updateGpa,
    };
    this.state.diplomaMetadata.set(tokenId, updated);
    this.state.diplomaUpdates.set(tokenId, {
      updateDegreeType,
      updateGpa,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  revokeDiploma(tokenId: number): Result<boolean> {
    const metadata = this.state.diplomaMetadata.get(tokenId);
    if (!metadata) return { ok: false, value: ERR_INVALID_ID };
    if (metadata.university !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const updated: DiplomaMetadata = {
      ...metadata,
      status: false,
    };
    this.state.diplomaMetadata.set(tokenId, updated);
    return { ok: true, value: true };
  }

  isDiplomaValid(tokenId: number): Result<boolean> {
    const metadata = this.state.diplomaMetadata.get(tokenId);
    if (!metadata) return { ok: false, value: ERR_INVALID_ID };
    return { ok: true, value: metadata.status };
  }

  getDiplomaCount(): Result<number> {
    return { ok: true, value: this.state.lastTokenId };
  }
}

describe("DiplomaNFT", () => {
  let contract: DiplomaNFTMock;

  beforeEach(() => {
    contract = new DiplomaNFTMock();
    contract.reset();
  });

  it("mints a diploma successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    const result = contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(1);

    const diploma = contract.getDiploma(1);
    expect(diploma?.degreeType).toBe("Bachelor");
    expect(diploma?.gpa).toBe(350);
    expect(diploma?.graduationDate).toBe(2025);
    expect(diploma?.honors).toBe("Cum Laude");
    expect(diploma?.major).toBe("Computer Science");
    expect(diploma?.minor).toBe("Math");
    expect(diploma?.status).toBe(true);
    expect(diploma?.fieldOfStudy).toBe("Engineering");
    expect(diploma?.creditHours).toBe(120);
    expect(diploma?.thesisTitle).toBe(null);
    expect(diploma?.advisor).toBe(null);
    expect(diploma?.awards).toEqual(["Award1"]);
    expect(diploma?.verificationLevel).toBe(3);
    expect(contract.getOwner(1)).toBe("ST3RECIPIENT");
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects mint without authority contract", () => {
    const transcriptHash = new Uint8Array(32).fill(0);
    const result = contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects mint by unauthorized university", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.authorizedUniversities.clear();
    const transcriptHash = new Uint8Array(32).fill(0);
    const result = contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects invalid degree type", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    const result = contract.mintDiploma(
      "ST3RECIPIENT",
      "",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_DEGREE_TYPE);
  });

  it("rejects invalid GPA", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    const result = contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      450,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_GPA);
  });

  it("transfers diploma successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.caller = "ST3RECIPIENT";
    const result = contract.transferDiploma(1, "ST3RECIPIENT", "ST4NEW");
    expect(result.ok).toBe(true);
    expect(contract.getOwner(1)).toBe("ST4NEW");
  });

  it("rejects transfer by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.caller = "ST4FAKE";
    const result = contract.transferDiploma(1, "ST3RECIPIENT", "ST4NEW");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("burns diploma successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.caller = "ST3RECIPIENT";
    const result = contract.burnDiploma(1);
    expect(result.ok).toBe(true);
    expect(contract.getOwner(1)).toBe(null);
  });

  it("rejects burn by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.caller = "ST4FAKE";
    const result = contract.burnDiploma(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_OWNER);
  });

  it("updates diploma successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    const result = contract.updateDiploma(1, "Master", 380);
    expect(result.ok).toBe(true);
    const diploma = contract.getDiploma(1);
    expect(diploma?.degreeType).toBe("Master");
    expect(diploma?.gpa).toBe(380);
    const update = contract.state.diplomaUpdates.get(1);
    expect(update?.updateDegreeType).toBe("Master");
    expect(update?.updateGpa).toBe(380);
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update by non-issuer", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.caller = "ST4FAKE";
    const result = contract.updateDiploma(1, "Master", 380);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("revokes diploma successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    const result = contract.revokeDiploma(1);
    expect(result.ok).toBe(true);
    const diploma = contract.getDiploma(1);
    expect(diploma?.status).toBe(false);
  });

  it("rejects revoke by non-issuer", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.caller = "ST4FAKE";
    const result = contract.revokeDiploma(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("checks diploma validity correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    const result = contract.isDiplomaValid(1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    contract.revokeDiploma(1);
    const result2 = contract.isDiplomaValid(1);
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("returns correct diploma count", () => {
    contract.setAuthorityContract("ST2TEST");
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    contract.mintDiploma(
      "ST4RECIPIENT",
      "Master",
      380,
      2026,
      "Magna Cum Laude",
      "Physics",
      null,
      transcriptHash,
      "Science",
      150,
      "Thesis Title",
      "ST5ADVISOR",
      ["Award2", "Award3"],
      4
    );
    const result = contract.getDiplomaCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("sets mint fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setMintFee(1000);
    expect(result.ok).toBe(true);
    expect(contract.state.mintFee).toBe(1000);
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects mint fee change without authority", () => {
    const result = contract.setMintFee(1000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects max diplomas exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxDiplomas = 1;
    const transcriptHash = new Uint8Array(32).fill(0);
    contract.mintDiploma(
      "ST3RECIPIENT",
      "Bachelor",
      350,
      2025,
      "Cum Laude",
      "Computer Science",
      "Math",
      transcriptHash,
      "Engineering",
      120,
      null,
      null,
      ["Award1"],
      3
    );
    const result = contract.mintDiploma(
      "ST4RECIPIENT",
      "Master",
      380,
      2026,
      "Magna Cum Laude",
      "Physics",
      null,
      transcriptHash,
      "Science",
      150,
      "Thesis Title",
      "ST5ADVISOR",
      ["Award2", "Award3"],
      4
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_DIPLOMAS_EXCEEDED);
  });
});