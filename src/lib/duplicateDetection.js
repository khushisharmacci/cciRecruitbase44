/**
 * Shared Duplicate Detection Utility
 * Used by: Upload Wizard, Candidate Sync, Call Logs, Upload Wizard
 * 
 * Priority: Email → Phone → LinkedIn → Full Name + Current Company
 */

/**
 * Normalize string for comparison (lowercase, trim, remove extra spaces)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalize(str) {
  if (!str) return "";
  return String(str).toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Check if email matches
 * @param {string} email1
 * @param {string} email2
 * @returns {boolean} True if emails match
 */
function emailMatches(email1, email2) {
  if (!email1 || !email2) return false;
  return normalize(email1) === normalize(email2);
}

/**
 * Check if phone matches (removes non-numeric characters)
 * @param {string} phone1
 * @param {string} phone2
 * @returns {boolean} True if phones match
 */
function phoneMatches(phone1, phone2) {
  if (!phone1 || !phone2) return false;
  const clean1 = String(phone1).replace(/\D/g, "");
  const clean2 = String(phone2).replace(/\D/g, "");
  return clean1 === clean2 && clean1.length >= 7; // At least 7 digits
}

/**
 * Check if LinkedIn URL matches
 * @param {string} url1
 * @param {string} url2
 * @returns {boolean} True if URLs match
 */
function linkedinMatches(url1, url2) {
  if (!url1 || !url2) return false;
  // Extract profile identifier (handle multiple formats)
  const extract = (url) => {
    if (!url) return "";
    // Remove protocol and www
    let clean = String(url).toLowerCase().replace(/^https?:\/\/(www\.)?/, "");
    // Handle different formats: linkedin.com/in/john or linkedin.com/in/john-doe
    const match = clean.match(/linkedin\.com(?:\/in\/)?([a-z0-9-]+)/);
    return match ? match[1].replace(/-/g, "") : clean;
  };
  const extracted1 = extract(url1);
  const extracted2 = extract(url2);
  return extracted1 && extracted2 && extracted1 === extracted2;
}

/**
 * Check if name + company combination matches
 * @param {string} name1
 * @param {string} company1
 * @param {string} name2
 * @param {string} company2
 * @returns {boolean} True if both name and company match
 */
function nameAndCompanyMatch(name1, company1, name2, company2) {
  if (!name1 || !name2) return false;
  // At least one must have company info for this to be meaningful
  if (!company1 && !company2) return false;
  
  const nameMatch = normalize(name1) === normalize(name2);
  const companyMatch = normalize(company1) === normalize(company2);
  
  return nameMatch && companyMatch;
}

/**
 * Find duplicate candidate in list using priority-based matching
 * Priority: Email → Phone → LinkedIn → Full Name + Current Company
 * 
 * @param {object} candidate - Candidate to check
 * @param {array} existingCandidates - List of existing candidates to search
 * @returns {object|null} Duplicate candidate or null if none found
 */
export function findDuplicateCandidate(candidate, existingCandidates) {
  if (!candidate || !existingCandidates || existingCandidates.length === 0) {
    return null;
  }

  // Priority 1: Email match
  if (candidate.email) {
    const byEmail = existingCandidates.find(c => emailMatches(c.email, candidate.email));
    if (byEmail) return byEmail;
  }

  // Priority 2: Phone match
  if (candidate.phone) {
    const byPhone = existingCandidates.find(c => phoneMatches(c.phone, candidate.phone));
    if (byPhone) return byPhone;
  }

  // Priority 3: LinkedIn URL match
  if (candidate.linkedin_url) {
    const byLinkedIn = existingCandidates.find(c =>
      linkedinMatches(c.linkedin_url, candidate.linkedin_url)
    );
    if (byLinkedIn) return byLinkedIn;
  }

  // Priority 4: Full Name + Current Company match
  if (candidate.full_name) {
    const byNameCompany = existingCandidates.find(c =>
      nameAndCompanyMatch(c.full_name, c.current_company, candidate.full_name, candidate.current_company)
    );
    if (byNameCompany) return byNameCompany;
  }

  return null;
}

/**
 * Find duplicate in any list using field matching
 * Useful for generic duplicate detection across entity types
 * 
 * @param {object} record - Record to check
 * @param {array} existingRecords - List of existing records
 * @param {array} matchFields - Fields to match on (in priority order)
 * @returns {object|null} Duplicate record or null if none found
 */
export function findDuplicate(record, existingRecords, matchFields = []) {
  if (!record || !existingRecords || existingRecords.length === 0 || matchFields.length === 0) {
    return null;
  }

  // Try each match field in order
  for (const field of matchFields) {
    const value = record[field];
    if (!value) continue;

    // Special matching logic for certain fields
    let matchFn;
    if (field === "email") {
      matchFn = (r) => emailMatches(r[field], value);
    } else if (field === "phone") {
      matchFn = (r) => phoneMatches(r[field], value);
    } else if (field === "linkedin_url") {
      matchFn = (r) => linkedinMatches(r[field], value);
    } else {
      // Default: normalize string comparison
      matchFn = (r) => normalize(r[field]) === normalize(value);
    }

    const match = existingRecords.find(matchFn);
    if (match) return match;
  }

  return null;
}

/**
 * Batch check multiple records for duplicates
 * Returns a map of record → duplicate match
 * 
 * @param {array} records - Records to check
 * @param {array} existingRecords - Existing records to search
 * @param {string} entityType - Entity type ("Candidate", "Client", etc.)
 * @returns {map} Map of index → duplicate record
 */
export function findDuplicatesBatch(records, existingRecords, entityType = "Candidate") {
  const duplicates = new Map();

  if (entityType === "Candidate") {
    records.forEach((record, index) => {
      const dup = findDuplicateCandidate(record, existingRecords);
      if (dup) duplicates.set(index, dup);
    });
  } else {
    // For other entity types, use generic duplicate detection
    records.forEach((record, index) => {
      const dup = findDuplicate(record, existingRecords, ["email", "phone", "name"]);
      if (dup) duplicates.set(index, dup);
    });
  }

  return duplicates;
}
