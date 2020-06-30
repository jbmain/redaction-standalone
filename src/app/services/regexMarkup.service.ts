import { Injectable } from "@angular/core";
import { IEntityTextGrouping } from "../redaction/redaction.component.service";

interface ISuggestedMapping {
    label: string;
    field: string;
    value: string;
    isReference?: boolean;
}


@Injectable({
    providedIn: "root",
  })
export class RegexMarkupService {

  // For regex implementation
  private concepts: string[] = ["nlpPerson", "nlpPlace", "nlpPhone", "nlpEmail"];

  // Array of honorific prefixes
  // tslint:disable-next-line: max-line-length
  private personMarkers: string[] = ["1Lt", "1stLt", "2Lt", "2ndLt", "Amb", "BG", "BGen", "BrigGen", "Brother", "Capt", "CAPT", "CDR",
    "Col", "COL", "CPT", "Dean", "Dr", "Drs", "ENS",
    "Est", "Gen", "GEN", "Gov", "Hon", "Judge", "Justice", "LCDR", "LCpl", "Lt", "LT", "LTC", "LtCol", "LTG", "LtGen", "LTJG", "Maj",
    "MAJ", "MajGen", "Mayor", "Mdme",
    "MG", "Miss", "Mr", "Mrs", "Ms", "MSG", "Msgr", "MSgt", "Prince", "Prof", "Rabbi", "RADM", "Rev", "RT", "Senator", "Sir", "Sister"];

  // Array of common address components
  private addressMarkers: string[] = [
    /*  Buildings  */ "Building", "Church", "College", "Farm", "Hotel", "House", "Lighthouse", "Mall", "Manor", "Monument", "Museum",
    "Office", "Residence", "School", "Theatre", "Tower", "University", "Zoo",
    /*   Streets   */ "Alley", "Ally", "Aly", "Anex", "Annex", "Annx", "Anx", "Arc", "Arcade", "Av", "Ave", "Aven", "Avenu", "Avenue",
    "Avn", "Avnue", "Bayoo", "Bayou",
    "Bch", "Beach", "Bend", "Bnd", "Blf", "Bluf", "Bluff", "Bluffs", "Bot", "Btm", "Bottm", "Bottom", "Blvd", "Boul", "Boulevard", "Boulv",
    "Br", "Brnch", "Branch",
    "Brdge", "Brg", "Bridge", "Brk", "Brook", "Brooks", "Burg", "Burgs", "Byp", "Bypa", "Bypas", "Bypass", "Byps", "Camp", "Cp", "Cmp",
    "Canyn", "Canyon", "Cnyn",
    "Cape", "Cpe", "Causeway", "Causwa", "Cswy", "Cen", "Cent", "Center", "Centr", "Centre", "Cnter", "Cntr", "Ctr", "Centers", "Cir",
    "Circ", "Circl", "Circle", "Crcl",
    "Crcle", "Circles", "Clf", "Cliff", "Clfs", "Cliffs", "Clb", "Club", "Common", "Commons", "Cor", "Corner", "Corners", "Cors", "Course",
    "Crse", "Court", "Ct",
    "Courts", "Cts", "Cove", "Cv", "Coves", "Creek", "Crk", "Crescent", "Cres", "Crsent", "Crsnt", "Crest", "Cross", "Crossing", "Crssng",
    "Xing", "Crossroad",
    "Crossroads", "Curve", "Dale", "Dl", "Dam", "Dm", "Div", "Divide", "Dv", "Dvd", "Dr", "Driv", "Drive", "Drv", "Drives", "Est",
    "Estate", "Estates", "Ests", "Exp",
    "Expr", "Express", "Expressway", "Expw", "Expy", "Ext", "Extension", "Extn", "Extnsn", "Exts", "Fall", "Falls", "Fls", "Ferry", "Frry",
    "Fry", "Field", "Fld",
    "Fields", "Flds", "Flat", "Flt", "Flats", "Flts", "Ford", "Frd", "Fords", "Forest", "Forests", "Frst", "Forg", "Forge", "Frg",
    "Forges", "Fork", "Frk", "Forks",
    "Frks", "Fort", "Frt", "Ft", "Freeway", "Freewy", "Frway", "Frwy", "Fwy", "Garden", "Gardn", "Grden", "Grdn", "Gardens", "Gdns",
    "Grdns", "Gateway", "Gatewy",
    "Gatway", "Gtway", "Gtwy", "Glen", "Gln", "Glens", "Green", "Grn", "Greens", "Grov", "Grove", "Grv", "Groves", "Harb", "Harbor",
    "Harbr", "Hbr", "Hrbor", "Harbors",
    "Haven", "Hvn", "Heights", "Ht", "Hts", "Highway", "Highwy", "Hiway", "Hiwy", "Hway", "Hwy", "Hill", "Hl", "Hills", "Hls", "Hllw",
    "Hollow", "Hollows", "Holw",
    "Holws", "Inlt", "Is", "Island", "Islnd", "Islands", "Islnds", "Iss", "Isle", "Isles", "Jct", "Jction", "Jctn", "Junction", "Junctn",
    "Juncton", "Jctns","Jcts",
    "Junctions", "Key", "Ky", "Keys", "Kys", "Knl", "Knol", "Knoll", "Knls", "Knolls", "Lk", "Lake", "Lks", "Lakes", "Land", "Landing",
    "Lndg", "Lndng", "Lane", "Ln",
    "Lgt", "Light", "Lights", "Lf", "Loaf", "Lck", "Lock", "Lcks", "Locks", "Ldg", "Ldge", "Lodg", "Lodge", "Loop", "Loops", "Mall", "Mnr",
    "Manor", "Manors", "Mnrs",
    "Meadow", "Mdw", "Mdws", "Meadows", "Medows", "Mews", "Mill", "Mills", "Missn", "Mssn", "Motorway", "Mnt", "Mt", "Mount", "Mntain",
    "Mntn", "Mountain", "Mountin",
    "Mtin", "Mtn", "Mntns", "Mountains", "Nck", "Neck", "Orch", "Orchard", "Orchrd", "Oval", "Ovl", "Overpass", "Park", "Prk", "Parks",
    "Parkway", "Parkwy", "Pkway",
    "Pkwy", "Pky", "Parkways", "Pkwys", "Pass", "Passage", "Path", "Paths", "Pike", "Pikes", "Pine", "Pines", "Pnes", "Pl", "Plain", "Pln",
    "Plains", "Plns", "Plaza",
    "Plz", "Plza", "Point", "Pt", "Points", "Pts", "Port", "Prt", "Ports", "Prts", "Pr", "Prairie", "Prr", "Rad", "Radial", "Radiel",
    "Radl", "Ramp", "Ranch", "Ranches",
    "Rnch", "Rnchs", "Rapid", "Rpd", "Rapids", "Rpds", "Rest", "Rst", "Rdg", "Rdge", "Ridge", "Rdgs", "Ridges", "Riv", "River", "Rvr",
    "Rivr", "Rd", "Road", "Roads",
    "Rds", "Route", "Row", "Rue", "Run", "Shl", "Shoal", "Shls", "Shoals", "Shoar", "Shore", "Shr", "Shoars", "Shores", "Shrs", "Skyway",
    "Spg", "Spng", "Spring", "Sprng",
    "Spgs", "Spngs", "Springs", "Sprngs", "Spur", "Spurs", "Sq", "Sqr", "Sqre", "Squ", "Square", "Sqrs", "Squares", "Sta", "Station",
    "Statn", "Stn", "Stra", "Strav",
    "Straven", "Stravenue", "Stravn", "Strvn", "Strvnue", "Stream", "Streme", "Strm", "Street", "Strt", "St", "Str", "Streets", "Smt",
    "Sumit", "Sumitt", "Summit", "Ter",
    "Terr", "Terrace", "Throughway", "Trace", "Traces", "Trce", "Track", "Tracks", "Trak", "Trk", "Trks", "Trafficway", "Trail", "Trails",
    "Trl", "Trls", "Trailer",
    "Trlr", "Trlrs", "Tunel", "Tunl", "Tunls", "Tunnel", "Tunnels", "Tunnl", "Trnpk", "Turnpike", "Turnpk", "Underpass", "Un", "Union",
    "Unions", "Valley", "Vally",
    "Vlly", "Vly", "Valleys", "Vlys", "Vdct", "Via", "Viadct", "Viaduct", "View", "Vw", "Views", "Vws", "Vill", "Villag", "Village",
    "Villg", "Villiage", "Vlg",
    "Villages", "Vlgs", "Ville", "Vl", "Vis", "Vist", "Vista", "Vst", "Vsta", "Walk", "Walks", "Wall", "Wy", "Way", "Ways", "Well",
    "Wells", "Wls",
    /*    Areas    */ "Borough", "City", "District", "Parish", "Suburb", "Town", "Township", "Village",
    /* Postal Code */ "[A-Z]{2,3} \\d{4,5}[ \\-]?\\d{4,5}", "[A-Z]{1,2}\\d{1,2} ?\\d[A-Z]{2}"
  ];

  // Ranges of characters considered letters
  private upperRanges: string[] = ["A-Z", "\À-\Ö", "\Ø-\Þ"];
  private lowerRanges: string[] = ["a-z", "\ß-\ö", "\ø-\ÿ"];

  // Common expression ranges
  private word: string = this.lowerRanges.join("") + this.upperRanges.join("");
  private wordUpper: string = this.upperRanges.join("");

  // Regular expressions designed for free text rather than strict validation
  private email: RegExp = new RegExp("\\b([0-9" + this.word + "][0-9" + this.word + "._-]*@[0-9" + this.word + "][0-9" + this.word + "._\\-]*[" + this.word + "])\\b", "g");
  private phone: RegExp = new RegExp("[\\b+]?(?:(?:\\d{1,5}|\\(\\d{1,5}\\))[ \\-]*\\d{1,3}){2,3}\\d\\b", "g");
  // tslint:disable-next-line: max-line-length
  private person: RegExp = new RegExp("\\b(?:" + this.personMarkers.join("|") + ")\\b\\s*\\.?(?:\\s*[" + this.wordUpper + "][" + this.word + "\\-]*)+", "g");
  private personClean: RegExp = new RegExp("\\b(?:" + this.personMarkers.join("|") + ")\\b\\s*\\.?\s*", "g");
  // tslint:disable-next-line: max-line-length
  private address: RegExp = new RegExp("(?:[0-9" + this.wordUpper + "][0-9" + this.word + "\\-]*[,\\s]+)+\\b(?:" + this.addressMarkers.join("|") +
    ")\\b(?:[,\\s]+[0-9" + this.wordUpper + "][0-9" + this.word + "\\-]*)*", "g");


  // Return a list of text groupings by analysing the supplied text
  public getRedaction(text: string): IEntityTextGrouping[] {
    const markup: IEntityTextGrouping[] = [];

    // Ensure line breaks always have punctuation to avoid matching across paragraphs
    text = text.replace(/\n/g, " . ");

    this.addTextGroupings("nlpPerson", this.findPerson(text), markup);
    this.addTextGroupings("nlpPlace", this.findAddress(text), markup);
    this.addTextGroupings("nlpEmail", this.findEmail(text), markup);
    this.addTextGroupings("nlpPhone", this.findPhone(text), markup);

    return markup;
  }

  public getRedactionConcepts(): string[] {
    return this.concepts;
}

  // Add new text groupings
  private addTextGroupings(group: string, list: string[], entityTextGroups: IEntityTextGrouping[]): void {
    return Array.from(new Set(list)).forEach((text: string) => {
      entityTextGroups.push({text, group});
    });
  }
  // Return a list of concepts that the VTA model may provide
  public getSupportedConcepts(): string[] {
    return this.concepts;
  }

  // Return a list of suggested mappings for a given entity
  public getSuggestedMappings(selectedText: string[], entityName: string): ISuggestedMapping[] {
    if (entityName === "person") {
      return this.personMappings(selectedText[0]);
    } else if (entityName === "telecoms") {
      return this.telecomMappings(selectedText[0]);
    } else if (entityName === "location") {
      return this.locationMappings(selectedText[0]);
    }
    return [];
  }

  // Find anything that looks like an email address
  public findEmail(text: string): string[] {
    return text.match(this.email) ?? [];
  }

  // Find anything that looks like a phone number
  public findPhone(text: string): string[] {
    return text.match(this.phone) ?? [];
  }

  // Find the names of people using honorific prefixes
  public findPerson(text: string): string[] {
    const people: string[] = [];
    text.match(this.person)?.forEach((fullname: string): void => {
      people.push(fullname);
      // Also add the individual names with and without the honorific prefix
      const prefix = fullname.match(this.personClean);
      let honorific: string;
      if (prefix?.length) {
        honorific = prefix[0].trim();
      }
      const cleanName = fullname.replace(this.personClean, "");
      people.push(cleanName);
      cleanName.split(/\s+/).forEach((name: string) => {
        if (honorific) {
          people.push(honorific + " " + name);
        }
        people.push(name);
      });
    });
    return people;
  }

  // Find addresses using common place markers
  public findAddress(text: string): string[] {
    const addresses: string[] = [];
    text.match(this.address)?.forEach((address: string): void => {
      addresses.push(address);
      // Also add the address components as separated by commas
      addresses.push(...address.split(/\s*,\s*/g));
    });
    return addresses;
  }

  // Suggest mappings for locations
  private locationMappings(selectedText: string): ISuggestedMapping[] {
    let words: string[] = [];
    // Remove any numbers on their own, assume building_number
    selectedText = selectedText.replace(/^(\d+)\s*/, (_match: string, number: string) => {
      words.push(number);
      return "";
    });
    // Assume address lines are split by commas.
    words = words.concat(selectedText.split(",").filter((word: string) => {
      if (word.length > 0) {
        return word.trim();
      }
      return false;
    }));
    const mappings = [];
    if (words.length === 4) {
      mappings.push({label: "Building or house number", field: "building_number", value: words[0]});
      mappings.push({label: "Street", field: "street", value: words[1]});
      mappings.push({label: "Town or city", field: "town", value: words[2]});
      mappings.push({label: "Postcode/ZIP", field: "postcode_zip", value: words[3]});
    } else if (words.length === 3) {
      mappings.push({label: "Building or house number", field: "building_number", value: words[0]});
      mappings.push({label: "Street", field: "street", value: words[1]});
      mappings.push({label: "Town or City", field: "town", value: words[2]});
    } else if (words.length === 2) {
      mappings.push({label: "Street", field: "street", value: words[0]});
      mappings.push({label: "Town or City", field: "town", value: words[1]});
    } else {
      mappings.push({label: "Street", field: "street", value: words[0]});
    }
    return mappings;
  }

  // Suggest mappings for names
  private personMappings(selectedText: string): ISuggestedMapping[] {
    const words = selectedText.split(" ").filter((word: string) => {
      return word.length > 0;
    });
    const mappings: ISuggestedMapping[] = [];
    const firstNameLabel = "First name";
    const firstNameField = "first_name";
    const lastNameLabel = "Last Name";
    const lastNameField = "last_name";
    if (words.length === 3) {
      const title = words[0].replace(/[^\w]/g, "");
      mappings.push({label: "Title", field: "title", value: title, isReference: true});
      mappings.push({label: firstNameLabel, field: firstNameField, value: words[1]});
      mappings.push({label: lastNameLabel, field: lastNameField, value: words[2]});
    } else if (words.length === 2) {
      mappings.push({label: firstNameLabel, field: firstNameField, value: words[0]});
      mappings.push({label: lastNameLabel, field: lastNameField, value: words[1]});
    } else {
      mappings.push({label: firstNameLabel, field: firstNameField, value: words[0]});
    }
    return mappings;
  }

  // Suggest mappings for telecoms
  private telecomMappings(selectedText: string): ISuggestedMapping[] {
    const mappings = [{label: "Detail", field: "detail", value: selectedText}];
    if (selectedText.match(this.email)) {
      mappings.push({label: "Type", field: "telecoms_type", value: "E-mail Address"});
    } else if (selectedText.match(this.phone)) {
      mappings.push({label: "Type", field: "telecoms_type", value: "Landline"});
    }
    return mappings;
  }
}
