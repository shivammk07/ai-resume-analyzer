package com.careerpulse.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Domain model representing a structured Resume or Formal Bio-Data profile in Core Java 17.
 * Supports optional offline profile photos (Base64 Data URL), work experience, skills,
 * education, certifications, languages, personal Bio-Data fields, and a signed Declaration.
 */
public class ResumeBuilderProfile {
    /**
     * Supported visual layout templates for HTML / printable PDF / Word export.
     */
    public enum TemplateStyle {
        EXECUTIVE_MODERN,
        SIDEBAR_PRO,
        CLASSIC_ATS,
        FORMAL_BIODATA
    }

    /**
     * Single work experience entry.
     *
     * @param role job title
     * @param company organization name
     * @param period date range
     * @param bullets quantified achievement bullets
     */
    public record ExperienceEntry(String role, String company, String period, List<String> bullets) {
    }

    /**
     * Single education or academic qualification entry.
     *
     * @param degree degree or certificate title
     * @param institution university, college, or board
     * @param period graduation period
     * @param details GPA, honors, or percentage
     */
    public record EducationEntry(String degree, String institution, String period, String details) {
    }

    private String fullName = "Aarav Sharma";
    private String headline = "Senior Java Backend Engineer";
    private String email = "aarav.sharma@example.com";
    private String phone = "+91 98765 43210";
    private String location = "Bengaluru, India";
    private String linkedin = "linkedin.com/in/aarav-sharma-java";
    private String github = "github.com/aaravsharma-dev";
    private String photoDataUrl = "";
    private boolean showPhoto = true;
    private String summary = "";
    private TemplateStyle templateStyle = TemplateStyle.EXECUTIVE_MODERN;
    private String accentHex = "#3730a3";
    private List<String> skills = new ArrayList<>();
    private List<String> languages = new ArrayList<>();
    private List<String> certifications = new ArrayList<>();
    private List<ExperienceEntry> experiences = new ArrayList<>();
    private List<EducationEntry> education = new ArrayList<>();

    // Formal Bio-Data personal details & declaration
    private boolean includeBioData;
    private String dateOfBirth = "";
    private String gender = "";
    private String maritalStatus = "";
    private String nationality = "";
    private String fatherName = "";
    private String permanentAddress = "";
    private String hobbies = "";
    private String declaration = "I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief.";
    private String declarationPlace = "";
    private String declarationDate = "";

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName != null ? fullName : "";
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline != null ? headline : "";
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email : "";
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone != null ? phone : "";
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location != null ? location : "";
    }

    public String getLinkedin() {
        return linkedin;
    }

    public void setLinkedin(String linkedin) {
        this.linkedin = linkedin != null ? linkedin : "";
    }

    public String getGithub() {
        return github;
    }

    public void setGithub(String github) {
        this.github = github != null ? github : "";
    }

    public String getPhotoDataUrl() {
        return photoDataUrl;
    }

    public void setPhotoDataUrl(String photoDataUrl) {
        this.photoDataUrl = photoDataUrl != null ? photoDataUrl : "";
    }

    public boolean isShowPhoto() {
        return showPhoto;
    }

    public void setShowPhoto(boolean showPhoto) {
        this.showPhoto = showPhoto;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary != null ? summary : "";
    }

    public TemplateStyle getTemplateStyle() {
        return templateStyle;
    }

    public void setTemplateStyle(TemplateStyle templateStyle) {
        this.templateStyle = templateStyle != null ? templateStyle : TemplateStyle.EXECUTIVE_MODERN;
    }

    public String getAccentHex() {
        return accentHex;
    }

    public void setAccentHex(String accentHex) {
        if (accentHex != null && accentHex.matches("^#[0-9a-fA-F]{6}$")) {
            this.accentHex = accentHex;
        }
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills != null ? new ArrayList<>(skills) : new ArrayList<>();
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages != null ? new ArrayList<>(languages) : new ArrayList<>();
    }

    public List<String> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<String> certifications) {
        this.certifications = certifications != null ? new ArrayList<>(certifications) : new ArrayList<>();
    }

    public List<ExperienceEntry> getExperiences() {
        return experiences;
    }

    public void setExperiences(List<ExperienceEntry> experiences) {
        this.experiences = experiences != null ? new ArrayList<>(experiences) : new ArrayList<>();
    }

    public List<EducationEntry> getEducation() {
        return education;
    }

    public void setEducation(List<EducationEntry> education) {
        this.education = education != null ? new ArrayList<>(education) : new ArrayList<>();
    }

    public boolean isIncludeBioData() {
        return includeBioData;
    }

    public void setIncludeBioData(boolean includeBioData) {
        this.includeBioData = includeBioData;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth != null ? dateOfBirth : "";
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender != null ? gender : "";
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus != null ? maritalStatus : "";
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality != null ? nationality : "";
    }

    public String getFatherName() {
        return fatherName;
    }

    public void setFatherName(String fatherName) {
        this.fatherName = fatherName != null ? fatherName : "";
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress != null ? permanentAddress : "";
    }

    public String getHobbies() {
        return hobbies;
    }

    public void setHobbies(String hobbies) {
        this.hobbies = hobbies != null ? hobbies : "";
    }

    public String getDeclaration() {
        return declaration;
    }

    public void setDeclaration(String declaration) {
        this.declaration = declaration != null ? declaration : "";
    }

    public String getDeclarationPlace() {
        return declarationPlace;
    }

    public void setDeclarationPlace(String declarationPlace) {
        this.declarationPlace = declarationPlace != null ? declarationPlace : "";
    }

    public String getDeclarationDate() {
        return declarationDate;
    }

    public void setDeclarationDate(String declarationDate) {
        this.declarationDate = declarationDate != null ? declarationDate : "";
    }
}
