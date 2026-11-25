package com.careerpulse.gui;

import com.careerpulse.engine.ResumeAnalyzerService;
import com.careerpulse.engine.ResumeDocumentBuilder;
import com.careerpulse.exception.DatabaseOperationException;
import com.careerpulse.gui.SwingTableModels.AuditHistoryTableModel;
import com.careerpulse.gui.SwingTableModels.BenchmarkResultTableModel;
import com.careerpulse.gui.SwingTableModels.FixRecommendationTableModel;
import com.careerpulse.model.AnalysisReport;
import com.careerpulse.model.AuditLogEntry;
import com.careerpulse.model.BenchmarkModels.BenchmarkSummary;
import com.careerpulse.model.CategoryScore;
import com.careerpulse.model.ResumeBuilderProfile;
import com.careerpulse.model.ResumeBuilderProfile.EducationEntry;
import com.careerpulse.model.ResumeBuilderProfile.ExperienceEntry;
import com.careerpulse.model.ResumeBuilderProfile.TemplateStyle;
import com.careerpulse.model.RetentionPolicy;
import com.careerpulse.privacy.PiiRedactor;
import com.careerpulse.util.DocumentTextExtractor;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JSplitPane;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import javax.swing.SwingWorker;
import javax.swing.UIManager;
import javax.swing.border.EmptyBorder;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * CareerPulse Java Swing Desktop Application providing a native desktop GUI client
 * alongside the Jakarta EE 10 Servlet/JSP web application.
 *
 * <p>Architecture highlights:</p>
 * <ul>
 *   <li>4 tabbed workspaces: Resume Analyzer, JDBC Audit History, 12-Resume Validation Lab,
 *       and Privacy/PII Governance Inspector.</li>
 *   <li>Strict EDT responsiveness via {@link SwingWorker} for all scoring, benchmark,
 *       and JDBC DAO operations.</li>
 *   <li>Shared Core Java service and JDBC DAO layer ({@link DesktopAuditController}) with
 *       MySQL 8 primary support and automatic H2 fallback.</li>
 * </ul>
 *
 * <p>Run via Maven: {@code mvn compile exec:java}</p>
 *
 * @author Shivam Kumar (Team Moshdi)
 */
public class CareerPulseDesktopApp extends JFrame {
    private static final Color HEADER_BG = new Color(15, 23, 42);
    private static final Color ACCENT_INDIGO = new Color(79, 70, 229);
    private static final Color MUTED_TEXT = new Color(100, 116, 139);

    private static final String DEFAULT_SAMPLE_RESUME = """
        Priya Nair
        priya.nair@example.com | (415) 555-0192 | 742 Evergreen Terrace Street

        SUMMARY
        Senior Java Backend Architect with 8+ years designing JDBC persistence layers,
        Jakarta EE 10 Servlets, and fault-tolerant microservices on MySQL.

        EXPERIENCE
        Lead Java Engineer | FinCore Systems | 2021 - Present
        - Architected Jakarta EE Servlet and JDBC DAO services handling 42,000 req/sec at 99.98% uptime.
        - Optimized parameterized SQL queries, cutting p95 latency by 48% and saving $1.2M annually.
        - Automated Maven CI pipelines and 280 JUnit 5 tests, reducing regression defects by 61%.

        SKILLS
        Java 17, Jakarta Servlets, JSP, JDBC, MySQL, H2, Maven, JUnit 5, REST API, Docker, SQL

        EDUCATION
        B.S. Computer Science, State University (2014 - 2018)
        """;

    private static final String DEFAULT_SAMPLE_JD =
        "Required: Java 17, Jakarta Servlets, JSP, JDBC, MySQL, Maven, JUnit 5, REST API, Docker, SQL, Architecture.";

    private final DesktopAuditController controller;

    // Analyzer tab controls
    private final JTextField fileNameField = new JTextField("priya_nair_sample.txt", 18);
    private final JTextField targetRoleField = new JTextField("Senior Java Backend Engineer", 20);
    private final JTextArea resumeTextArea = new JTextArea(DEFAULT_SAMPLE_RESUME, 14, 50);
    private final JTextArea jdTextArea = new JTextArea(DEFAULT_SAMPLE_JD, 3, 50);
    private final JCheckBox redactPiiCheckBox = new JCheckBox("Mask PII before scoring & JDBC storage", true);
    private final JComboBox<RetentionPolicy> retentionCombo = new JComboBox<>(RetentionPolicy.values());
    private final JLabel overallScoreLabel = new JLabel("Ready — Run an offline deterministic audit");
    private final JLabel disclaimerLabel = new JLabel(AnalysisReport.VALIDATION_DISCLAIMER);
    private final Map<String, JProgressBar> categoryBars = new LinkedHashMap<>();
    private final FixRecommendationTableModel fixTableModel = new FixRecommendationTableModel();

    // History tab controls
    private final AuditHistoryTableModel historyTableModel = new AuditHistoryTableModel();
    private final JTable historyTable = new JTable(historyTableModel);

    // Benchmark tab controls
    private final BenchmarkResultTableModel benchmarkTableModel = new BenchmarkResultTableModel();
    private final JLabel benchmarkMetricsLabel = new JLabel(
        "Click 'Run 12-Resume Validation Suite' to verify MAE, Band Accuracy %, Spearman rho, and Latency."
    );

    // Privacy tab controls
    private final JTextArea piiInputArea = new JTextArea(
        "Jane Doe\nEmail: jane.doe@example.org | Phone: (415) 555-0199\n"
            + "SSN: 123-45-6789 | DOB: 04/12/1996 | Address: 742 Evergreen Terrace Street",
        6,
        40
    );
    private final JTextArea piiOutputArea = new JTextArea(6, 40);
    private final JTextArea auditLogArea = new JTextArea(8, 50);

    // Resume & Bio-Data Builder tab controls
    private final ResumeDocumentBuilder documentBuilder = new ResumeDocumentBuilder();
    private final JTextField builderNameField = new JTextField("Aarav Sharma", 18);
    private final JTextField builderRoleField = new JTextField("Senior Java Backend Engineer", 20);
    private final JTextField builderEmailField = new JTextField("aarav.sharma@example.com", 18);
    private final JTextField builderPhoneField = new JTextField("+91 98765 43210", 14);
    private final JTextField builderDobField = new JTextField("14 August 1998", 12);
    private final JTextField builderNationalityField = new JTextField("Indian", 12);
    private final JComboBox<TemplateStyle> builderTemplateCombo = new JComboBox<>(TemplateStyle.values());
    private final JCheckBox builderBioDataCheck = new JCheckBox("Include Bio-Data Personal Details & Declaration", true);
    private final JLabel builderPhotoLabel = new JLabel("Photo: Optional (click Choose Photo)");
    private String builderPhotoDataUrl = "";
    private final JTextArea builderSkillsArea = new JTextArea("Java 17, JDBC, Jakarta EE, MySQL, H2, Maven, JUnit 5, Docker", 2, 42);
    private final JTextArea builderBulletsArea = new JTextArea(
        "Architected Java 17 payment microservices processing 35,000+ TPS at 99.98% uptime.\n"
            + "Optimized parameterized JDBC SQL queries, cutting p99 latency by 58%.",
        4,
        42
    );
    private JTabbedPane mainTabs;

    private final JLabel statusBarLabel = new JLabel("Status: Ready");

    /**
     * Constructs and lays out the CareerPulse Swing desktop window.
     *
     * @param controller initialized MVC controller backed by JDBC
     */
    public CareerPulseDesktopApp(DesktopAuditController controller) {
        super("CareerPulse Desktop — Java 17 / JDBC / Deterministic ATS Suite (Team Moshdi)");
        this.controller = controller;
        this.retentionCombo.setSelectedItem(RetentionPolicy.HOURS_24);

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setMinimumSize(new Dimension(1080, 740));
        setPreferredSize(new Dimension(1180, 790));
        setLayout(new BorderLayout(0, 0));

        add(buildHeaderBanner(), BorderLayout.NORTH);
        add(buildMainTabs(), BorderLayout.CENTER);
        add(buildStatusBar(), BorderLayout.SOUTH);

        pack();
        setLocationRelativeTo(null);
        refreshHistoryAsync();
        refreshAuditLogsAsync();
    }

    private JPanel buildHeaderBanner() {
        JPanel banner = new JPanel(new BorderLayout());
        banner.setBackground(HEADER_BG);
        banner.setBorder(new EmptyBorder(14, 18, 14, 18));

        JLabel title = new JLabel("CareerPulse — Desktop ATS Analyzer & JDBC Governance Console");
        title.setForeground(Color.WHITE);
        title.setFont(new Font("SansSerif", Font.BOLD, 17));

        JLabel subtitle = new JLabel(
            "Team Moshdi (Lead: Shivam Kumar)  |  Offline Deterministic Engine  |  Active JDBC: "
                + controller.getActiveDatabaseDriver()
        );
        subtitle.setForeground(new Color(148, 163, 184));
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 12));

        JPanel textCol = new JPanel();
        textCol.setOpaque(false);
        textCol.setLayout(new BoxLayout(textCol, BoxLayout.Y_AXIS));
        textCol.add(title);
        textCol.add(Box.createVerticalStrut(3));
        textCol.add(subtitle);

        banner.add(textCol, BorderLayout.WEST);
        return banner;
    }

    private JTabbedPane buildMainTabs() {
        mainTabs = new JTabbedPane();
        mainTabs.setFont(new Font("SansSerif", Font.BOLD, 13));
        mainTabs.addTab("1. Resume Analyzer", buildAnalyzerTab());
        mainTabs.addTab("2. Saved History (JDBC)", buildHistoryTab());
        mainTabs.addTab("3. Validation Lab (12 Resumes)", buildBenchmarkTab());
        mainTabs.addTab("4. Privacy & PII Inspector", buildPrivacyTab());
        mainTabs.addTab("5. Resume & Bio-Data Builder", buildResumeBuilderTab());
        mainTabs.addChangeListener(e -> {
            int idx = mainTabs.getSelectedIndex();
            if (idx == 1) {
                refreshHistoryAsync();
            } else if (idx == 3) {
                refreshAuditLogsAsync();
            }
        });
        return mainTabs;
    }

    private JPanel buildAnalyzerTab() {
        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(new EmptyBorder(12, 12, 12, 12));

        // Left: Input panel
        JPanel inputPanel = new JPanel(new BorderLayout(8, 8));
        inputPanel.setBorder(BorderFactory.createTitledBorder("Resume Input & Privacy Options"));

        JPanel metaRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        JButton browseBtn = new JButton("Open Resume File...");
        browseBtn.addActionListener(e -> chooseResumeFile());
        metaRow.add(browseBtn);
        metaRow.add(new JLabel("File:"));
        metaRow.add(fileNameField);
        metaRow.add(new JLabel("Target Role:"));
        metaRow.add(targetRoleField);

        resumeTextArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        resumeTextArea.setLineWrap(true);
        resumeTextArea.setWrapStyleWord(true);

        jdTextArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        jdTextArea.setLineWrap(true);
        jdTextArea.setWrapStyleWord(true);

        JPanel textStack = new JPanel(new BorderLayout(6, 6));
        textStack.add(new JScrollPane(resumeTextArea), BorderLayout.CENTER);
        JPanel jdBox = new JPanel(new BorderLayout(4, 4));
        jdBox.add(new JLabel("Target Job Description / Keywords:"), BorderLayout.NORTH);
        jdBox.add(new JScrollPane(jdTextArea), BorderLayout.CENTER);
        textStack.add(jdBox, BorderLayout.SOUTH);

        JPanel controlsRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 4));
        controlsRow.add(redactPiiCheckBox);
        controlsRow.add(new JLabel("Retention TTL:"));
        controlsRow.add(retentionCombo);

        JButton analyzeBtn = new JButton("Run Deterministic ATS Audit");
        analyzeBtn.setBackground(ACCENT_INDIGO);
        analyzeBtn.setForeground(Color.WHITE);
        analyzeBtn.setFont(new Font("SansSerif", Font.BOLD, 13));
        analyzeBtn.addActionListener(e -> runAnalysisAsync(analyzeBtn));
        controlsRow.add(analyzeBtn);

        inputPanel.add(metaRow, BorderLayout.NORTH);
        inputPanel.add(textStack, BorderLayout.CENTER);
        inputPanel.add(controlsRow, BorderLayout.SOUTH);

        // Right: Output score gauges + fixes table
        JPanel outputPanel = new JPanel(new BorderLayout(8, 8));
        outputPanel.setBorder(BorderFactory.createTitledBorder("ATS Rubric Breakdown & Prioritized Fixes"));

        overallScoreLabel.setFont(new Font("SansSerif", Font.BOLD, 15));
        overallScoreLabel.setBorder(new EmptyBorder(4, 4, 6, 4));

        JPanel barsPanel = new JPanel(new GridLayout(5, 1, 6, 6));
        registerCategoryBar(barsPanel, "atsParsability", "ATS Parsability & Structure (25%)");
        registerCategoryBar(barsPanel, "quantifiableImpact", "Quantifiable Impact / XYZ (25%)");
        registerCategoryBar(barsPanel, "keywordMatch", "Keyword & Skill Alignment (20%)");
        registerCategoryBar(barsPanel, "actionVerbs", "Action Verbs & Ownership (15%)");
        registerCategoryBar(barsPanel, "formattingReadability", "Formatting & Readability (15%)");

        JPanel topOutput = new JPanel(new BorderLayout(6, 6));
        topOutput.add(overallScoreLabel, BorderLayout.NORTH);
        topOutput.add(barsPanel, BorderLayout.CENTER);

        JTable fixTable = new JTable(fixTableModel);
        fixTable.setRowHeight(24);
        fixTable.setFillsViewportHeight(true);

        disclaimerLabel.setFont(new Font("SansSerif", Font.ITALIC, 11));
        disclaimerLabel.setForeground(MUTED_TEXT);

        outputPanel.add(topOutput, BorderLayout.NORTH);
        outputPanel.add(new JScrollPane(fixTable), BorderLayout.CENTER);
        outputPanel.add(disclaimerLabel, BorderLayout.SOUTH);

        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, inputPanel, outputPanel);
        splitPane.setResizeWeight(0.52);
        root.add(splitPane, BorderLayout.CENTER);
        return root;
    }

    private void registerCategoryBar(JPanel container, String key, String label) {
        JPanel row = new JPanel(new BorderLayout(8, 2));
        JLabel lbl = new JLabel(label);
        lbl.setFont(new Font("SansSerif", Font.PLAIN, 12));
        JProgressBar bar = new JProgressBar(0, 100);
        bar.setStringPainted(true);
        bar.setValue(0);
        bar.setString("0 / 100");
        categoryBars.put(key, bar);
        row.add(lbl, BorderLayout.NORTH);
        row.add(bar, BorderLayout.CENTER);
        container.add(row);
    }

    private JPanel buildHistoryTab() {
        JPanel panel = new JPanel(new BorderLayout(8, 8));
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel toolbar = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        JButton refreshBtn = new JButton("Refresh JDBC History");
        refreshBtn.addActionListener(e -> refreshHistoryAsync());
        JButton deleteBtn = new JButton("Delete Selected Report");
        deleteBtn.addActionListener(e -> deleteSelectedHistoryRow());
        toolbar.add(refreshBtn);
        toolbar.add(deleteBtn);

        historyTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        historyTable.setRowHeight(24);
        historyTable.setFillsViewportHeight(true);

        panel.add(toolbar, BorderLayout.NORTH);
        panel.add(new JScrollPane(historyTable), BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildBenchmarkTab() {
        JPanel panel = new JPanel(new BorderLayout(8, 8));
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel top = new JPanel(new BorderLayout(8, 6));
        JButton runBtn = new JButton("Run 12-Resume Validation Suite");
        runBtn.setBackground(ACCENT_INDIGO);
        runBtn.setForeground(Color.WHITE);
        runBtn.setFont(new Font("SansSerif", Font.BOLD, 12));
        runBtn.addActionListener(e -> runBenchmarkAsync(runBtn));

        benchmarkMetricsLabel.setFont(new Font("SansSerif", Font.BOLD, 13));
        top.add(runBtn, BorderLayout.WEST);
        top.add(benchmarkMetricsLabel, BorderLayout.CENTER);

        JTable table = new JTable(benchmarkTableModel);
        table.setRowHeight(24);
        table.setFillsViewportHeight(true);

        JLabel scopeNote = new JLabel(
            "Validation Scope: Measures deterministic rubric calibration against 12 independently annotated "
                + "resumes across 4 quality tiers — not verified hiring outcomes."
        );
        scopeNote.setFont(new Font("SansSerif", Font.ITALIC, 11));
        scopeNote.setForeground(MUTED_TEXT);

        panel.add(top, BorderLayout.NORTH);
        panel.add(new JScrollPane(table), BorderLayout.CENTER);
        panel.add(scopeNote, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel buildPrivacyTab() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));

        piiInputArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        piiOutputArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        piiOutputArea.setEditable(false);

        JPanel piiGrid = new JPanel(new GridLayout(1, 2, 10, 6));
        JPanel leftBox = new JPanel(new BorderLayout(4, 4));
        leftBox.setBorder(BorderFactory.createTitledBorder("Raw Input Containing PII"));
        leftBox.add(new JScrollPane(piiInputArea), BorderLayout.CENTER);

        JPanel rightBox = new JPanel(new BorderLayout(4, 4));
        rightBox.setBorder(BorderFactory.createTitledBorder("Redacted Output Stored in JDBC"));
        rightBox.add(new JScrollPane(piiOutputArea), BorderLayout.CENTER);

        piiGrid.add(leftBox);
        piiGrid.add(rightBox);

        JPanel actionBar = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 4));
        JButton maskBtn = new JButton("Test PII Redaction");
        maskBtn.addActionListener(e -> {
            PiiRedactor.RedactionResult res = controller.testPiiRedaction(piiInputArea.getText());
            piiOutputArea.setText(res.redactedText());
            setStatus("Masked " + res.totalMaskedCount() + " PII items: " + res.categoryCounts());
        });
        JButton ttlPurgeBtn = new JButton("Purge Expired TTL Records");
        ttlPurgeBtn.addActionListener(e -> purgeExpiredAsync());
        JButton purgeAllBtn = new JButton("Purge All Desktop User Data");
        purgeAllBtn.addActionListener(e -> purgeAllAsync());

        actionBar.add(maskBtn);
        actionBar.add(ttlPurgeBtn);
        actionBar.add(purgeAllBtn);

        auditLogArea.setEditable(false);
        auditLogArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        JPanel logPanel = new JPanel(new BorderLayout());
        logPanel.setBorder(BorderFactory.createTitledBorder("JDBC Privacy & Access Audit Trail"));
        logPanel.add(new JScrollPane(auditLogArea), BorderLayout.CENTER);

        JPanel topHalf = new JPanel(new BorderLayout(6, 6));
        topHalf.add(piiGrid, BorderLayout.CENTER);
        topHalf.add(actionBar, BorderLayout.SOUTH);

        panel.add(topHalf, BorderLayout.NORTH);
        panel.add(logPanel, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildStatusBar() {
        JPanel bar = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 6));
        bar.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, new Color(203, 213, 225)));
        statusBarLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        bar.add(statusBarLabel);
        return bar;
    }

    private JPanel buildResumeBuilderTab() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel formGrid = new JPanel(new GridLayout(4, 2, 10, 8));
        formGrid.setBorder(BorderFactory.createTitledBorder("Resume & Formal Bio-Data Details"));
        formGrid.add(labeledField("Full Name:", builderNameField));
        formGrid.add(labeledField("Target Role:", builderRoleField));
        formGrid.add(labeledField("Email:", builderEmailField));
        formGrid.add(labeledField("Phone:", builderPhoneField));
        formGrid.add(labeledField("Date of Birth (Bio-Data):", builderDobField));
        formGrid.add(labeledField("Nationality:", builderNationalityField));
        formGrid.add(labeledField("Template:", builderTemplateCombo));

        JPanel photoRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        JButton choosePhotoBtn = new JButton("Choose Photo (JPG/PNG)...");
        choosePhotoBtn.addActionListener(e -> chooseProfilePhoto());
        photoRow.add(choosePhotoBtn);
        photoRow.add(builderPhotoLabel);
        formGrid.add(photoRow);

        JPanel textCenter = new JPanel(new GridLayout(2, 1, 8, 8));
        JPanel skillsBox = new JPanel(new BorderLayout(4, 4));
        skillsBox.setBorder(BorderFactory.createTitledBorder("Technical Skills (comma-separated)"));
        skillsBox.add(new JScrollPane(builderSkillsArea), BorderLayout.CENTER);

        JPanel bulletsBox = new JPanel(new BorderLayout(4, 4));
        bulletsBox.setBorder(BorderFactory.createTitledBorder("Experience Achievement Bullets (Google XYZ — one per line)"));
        bulletsBox.add(new JScrollPane(builderBulletsArea), BorderLayout.CENTER);
        textCenter.add(skillsBox);
        textCenter.add(bulletsBox);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 6));
        actions.add(builderBioDataCheck);

        JButton exportDocBtn = new JButton("Export Word / HTML (.doc)...");
        exportDocBtn.setBackground(ACCENT_INDIGO);
        exportDocBtn.setForeground(Color.WHITE);
        exportDocBtn.addActionListener(e -> exportBuiltResume(true));

        JButton exportTxtBtn = new JButton("Export ATS Text (.txt)...");
        exportTxtBtn.addActionListener(e -> exportBuiltResume(false));

        JButton sendToAuditBtn = new JButton("Audit in Analyzer Tab ->");
        sendToAuditBtn.addActionListener(e -> {
            ResumeBuilderProfile profile = collectBuilderProfile();
            resumeTextArea.setText(documentBuilder.renderPlainText(profile));
            fileNameField.setText("built_resume_biodata.txt");
            targetRoleField.setText(profile.getHeadline());
            if (mainTabs != null) {
                mainTabs.setSelectedIndex(0);
            }
            setStatus("Sent built resume to Analyzer tab (Live ATS Readiness: "
                + documentBuilder.computeLiveAtsReadinessScore(profile) + "/100)");
        });

        actions.add(exportDocBtn);
        actions.add(exportTxtBtn);
        actions.add(sendToAuditBtn);

        panel.add(formGrid, BorderLayout.NORTH);
        panel.add(textCenter, BorderLayout.CENTER);
        panel.add(actions, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel labeledField(String label, java.awt.Component comp) {
        JPanel row = new JPanel(new BorderLayout(6, 2));
        row.add(new JLabel(label), BorderLayout.WEST);
        row.add(comp, BorderLayout.CENTER);
        return row;
    }

    private void chooseProfilePhoto() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select Profile Photo (Optional)");
        chooser.setFileFilter(new FileNameExtensionFilter("Images (JPG, PNG, WEBP)", "jpg", "jpeg", "png", "webp"));
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File selected = chooser.getSelectedFile();
            try {
                byte[] bytes = Files.readAllBytes(selected.toPath());
                String lower = selected.getName().toLowerCase();
                String mime = lower.endsWith(".png") ? "image/png" : "image/jpeg";
                builderPhotoDataUrl = documentBuilder.encodePhotoToDataUrl(bytes, mime);
                builderPhotoLabel.setText("Loaded: " + selected.getName());
                setStatus("Embedded local profile photo offline (" + bytes.length + " bytes).");
            } catch (IOException ex) {
                setStatus("Photo load failed: " + ex.getMessage());
            }
        }
    }

    private ResumeBuilderProfile collectBuilderProfile() {
        ResumeBuilderProfile p = new ResumeBuilderProfile();
        p.setFullName(builderNameField.getText().trim());
        p.setHeadline(builderRoleField.getText().trim());
        p.setEmail(builderEmailField.getText().trim());
        p.setPhone(builderPhoneField.getText().trim());
        p.setLocation("Bengaluru, India");
        p.setSummary("Results-driven " + builderRoleField.getText().trim()
            + " focused on deterministic architecture, measurable latency reductions, and production reliability.");
        p.setTemplateStyle((TemplateStyle) builderTemplateCombo.getSelectedItem());
        p.setIncludeBioData(builderBioDataCheck.isSelected());
        p.setDateOfBirth(builderDobField.getText().trim());
        p.setNationality(builderNationalityField.getText().trim());
        p.setPhotoDataUrl(builderPhotoDataUrl);
        p.setShowPhoto(!builderPhotoDataUrl.isBlank());
        p.setSkills(Arrays.stream(builderSkillsArea.getText().split(","))
            .map(String::trim).filter(s -> !s.isBlank()).toList());
        List<String> bullets = Arrays.stream(builderBulletsArea.getText().split("\\r?\\n"))
            .map(String::trim).filter(s -> !s.isBlank()).toList();
        p.setExperiences(List.of(new ExperienceEntry(p.getHeadline(), "Enterprise Systems", "2022 - Present", bullets)));
        p.setEducation(List.of(new EducationEntry("B.Tech Computer Science", "NIT", "2016 - 2020", "First Class")));
        return p;
    }

    private void exportBuiltResume(boolean asWordDoc) {
        ResumeBuilderProfile profile = collectBuilderProfile();
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle(asWordDoc ? "Save Resume / Bio-Data (.doc)" : "Save ATS Plain Text (.txt)");
        chooser.setSelectedFile(new File(asWordDoc ? "CareerPulse_Resume_BioData.doc" : "CareerPulse_ATS_Resume.txt"));
        if (chooser.showSaveDialog(this) == JFileChooser.APPROVE_OPTION) {
            File target = chooser.getSelectedFile();
            try {
                String content = asWordDoc
                    ? documentBuilder.renderHtmlDocument(profile)
                    : documentBuilder.renderPlainText(profile);
                Files.writeString(target.toPath(), content, StandardCharsets.UTF_8);
                setStatus("Exported " + target.getName() + " (Live ATS Score: "
                    + documentBuilder.computeLiveAtsReadinessScore(profile) + "/100)");
            } catch (IOException ex) {
                JOptionPane.showMessageDialog(this, "Export failed: " + ex.getMessage(),
                    "Export Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void chooseResumeFile() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select Resume (DOCX, ODT, PPTX, PDF, RTF, HTML, JSON, TXT, MD)");
        chooser.setFileFilter(new FileNameExtensionFilter(
            "All Supported Resume Formats",
            "docx", "odt", "pptx", "pdf", "rtf", "html", "htm", "json", "txt", "md", "csv"
        ));
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File selected = chooser.getSelectedFile();
            try {
                byte[] rawBytes = Files.readAllBytes(selected.toPath());
                DocumentTextExtractor.ExtractionResult extracted =
                    DocumentTextExtractor.extract(rawBytes, selected.getName());
                resumeTextArea.setText(extracted.text());
                fileNameField.setText(selected.getName());
                setStatus("Loaded " + selected.getName() + " via " + extracted.detectedFormat()
                    + " (" + extracted.text().length() + " chars)");
            } catch (IOException ex) {
                JOptionPane.showMessageDialog(
                    this,
                    "Unable to read selected file: " + ex.getMessage(),
                    "File Read Error",
                    JOptionPane.ERROR_MESSAGE
                );
            }
        }
    }

    private void runAnalysisAsync(JButton triggerButton) {
        triggerButton.setEnabled(false);
        setStatus("Running offline deterministic ATS scoring engine...");

        final String text = resumeTextArea.getText();
        final String fileName = fileNameField.getText();
        final String role = targetRoleField.getText();
        final String jd = jdTextArea.getText();
        final boolean maskPii = redactPiiCheckBox.isSelected();
        final RetentionPolicy policy = (RetentionPolicy) retentionCombo.getSelectedItem();

        new SwingWorker<ResumeAnalyzerService.AnalysisBundle, Void>() {
            @Override
            protected ResumeAnalyzerService.AnalysisBundle doInBackground() throws Exception {
                return controller.analyzeAndSave(text, fileName, role, jd, maskPii, policy);
            }

            @Override
            protected void done() {
                triggerButton.setEnabled(true);
                try {
                    ResumeAnalyzerService.AnalysisBundle bundle = get();
                    AnalysisReport report = bundle.report();
                    overallScoreLabel.setText(String.format(
                        "Overall Score: %d / 100 (%s)  |  PII Masked: %d  |  TTL: %s  |  %d ms",
                        report.getOverallScore(),
                        report.getScoreLabel(),
                        report.getPiiItemsMasked(),
                        report.getRetentionPolicy().name(),
                        report.getAnalysisTimeMs()
                    ));
                    for (Map.Entry<String, JProgressBar> entry : categoryBars.entrySet()) {
                        CategoryScore cs = report.getCategoryScores().get(entry.getKey());
                        int score = cs != null ? cs.getScore() : 0;
                        entry.getValue().setValue(score);
                        entry.getValue().setString(score + " / 100");
                    }
                    fixTableModel.setItems(report.getPrioritizedFixes());
                    setStatus("Analysis complete — persisted via " + controller.getActiveDatabaseDriver());
                    refreshHistoryAsync();
                } catch (Exception ex) {
                    Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                    setStatus("Error: " + cause.getMessage());
                    JOptionPane.showMessageDialog(
                        CareerPulseDesktopApp.this,
                        cause.getMessage(),
                        "Analysis Validation Error",
                        JOptionPane.WARNING_MESSAGE
                    );
                }
            }
        }.execute();
    }

    private void refreshHistoryAsync() {
        new SwingWorker<List<AnalysisReport>, Void>() {
            @Override
            protected List<AnalysisReport> doInBackground() throws Exception {
                return controller.loadHistory();
            }

            @Override
            protected void done() {
                try {
                    List<AnalysisReport> reports = get();
                    historyTableModel.setReports(reports);
                } catch (Exception ex) {
                    setStatus("History load failed: " + ex.getMessage());
                }
            }
        }.execute();
    }

    private void deleteSelectedHistoryRow() {
        int selectedRow = historyTable.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Select a saved report row first.", "No Selection",
                JOptionPane.INFORMATION_MESSAGE);
            return;
        }
        AnalysisReport target = historyTableModel.getReportAt(selectedRow);
        if (target.getId() == null) {
            return;
        }
        new SwingWorker<Boolean, Void>() {
            @Override
            protected Boolean doInBackground() throws Exception {
                return controller.deleteReport(target.getId());
            }

            @Override
            protected void done() {
                try {
                    if (get()) {
                        setStatus("Deleted report ID " + target.getId() + " via JDBC DAO.");
                        refreshHistoryAsync();
                        refreshAuditLogsAsync();
                    }
                } catch (Exception ex) {
                    setStatus("Delete failed: " + ex.getMessage());
                }
            }
        }.execute();
    }

    private void runBenchmarkAsync(JButton triggerButton) {
        triggerButton.setEnabled(false);
        setStatus("Executing 12-resume labeled validation benchmark...");
        new SwingWorker<BenchmarkSummary, Void>() {
            @Override
            protected BenchmarkSummary doInBackground() throws Exception {
                return controller.runAndPersistBenchmark();
            }

            @Override
            protected void done() {
                triggerButton.setEnabled(true);
                try {
                    BenchmarkSummary summary = get();
                    benchmarkTableModel.setResults(summary.getResults());
                    benchmarkMetricsLabel.setText(String.format(
                        "Dataset: %d  |  Band Accuracy: %.1f%%  |  MAE: %.2f  |  Spearman rho: %.3f  |  p50/p95: %.2f / %.2f ms",
                        summary.getDatasetSize(),
                        summary.getBandAccuracyPct(),
                        summary.getMeanAbsoluteError(),
                        summary.getSpearmanRho(),
                        summary.getP50LatencyMs(),
                        summary.getP95LatencyMs()
                    ));
                    setStatus("Benchmark suite persisted (Run ID " + summary.getId() + ").");
                } catch (Exception ex) {
                    setStatus("Benchmark failed: " + ex.getMessage());
                }
            }
        }.execute();
    }

    private void purgeExpiredAsync() {
        new SwingWorker<Integer, Void>() {
            @Override
            protected Integer doInBackground() throws Exception {
                return controller.purgeExpiredRecords();
            }

            @Override
            protected void done() {
                try {
                    int count = get();
                    setStatus("Purged " + count + " expired TTL resume records.");
                    refreshHistoryAsync();
                    refreshAuditLogsAsync();
                } catch (Exception ex) {
                    setStatus("TTL cleanup failed: " + ex.getMessage());
                }
            }
        }.execute();
    }

    private void purgeAllAsync() {
        int choice = JOptionPane.showConfirmDialog(
            this,
            "Permanently delete all resumes and analysis reports owned by the desktop user?",
            "Confirm Full Privacy Purge",
            JOptionPane.YES_NO_OPTION,
            JOptionPane.WARNING_MESSAGE
        );
        if (choice != JOptionPane.YES_OPTION) {
            return;
        }
        new SwingWorker<Integer, Void>() {
            @Override
            protected Integer doInBackground() throws Exception {
                return controller.purgeAllDesktopData();
            }

            @Override
            protected void done() {
                try {
                    int count = get();
                    setStatus("Permanently purged " + count + " owned records.");
                    refreshHistoryAsync();
                    refreshAuditLogsAsync();
                } catch (Exception ex) {
                    setStatus("Purge failed: " + ex.getMessage());
                }
            }
        }.execute();
    }

    private void refreshAuditLogsAsync() {
        new SwingWorker<List<AuditLogEntry>, Void>() {
            @Override
            protected List<AuditLogEntry> doInBackground() throws Exception {
                return controller.loadAuditLogs();
            }

            @Override
            protected void done() {
                try {
                    List<AuditLogEntry> entries = get();
                    StringBuilder sb = new StringBuilder();
                    for (AuditLogEntry entry : entries) {
                        sb.append('[').append(entry.getCreatedAt()).append("] ")
                            .append(entry.getAction())
                            .append(" | resource=").append(entry.getResourceId())
                            .append(" | ").append(entry.getDetails())
                            .append('\n');
                    }
                    auditLogArea.setText(sb.length() > 0 ? sb.toString() : "No privacy audit events recorded yet.");
                } catch (Exception ex) {
                    auditLogArea.setText("Unable to load audit logs: " + ex.getMessage());
                }
            }
        }.execute();
    }

    private void setStatus(String message) {
        statusBarLabel.setText("Status: " + message);
    }

    /**
     * Application entry point for launching the CareerPulse Java Swing Desktop GUI.
     *
     * @param args optional command-line arguments (unused)
     */
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                    if ("Nimbus".equals(info.getName())) {
                        UIManager.setLookAndFeel(info.getClassName());
                        break;
                    }
                }
            } catch (Exception ignored) {
                // Keep default cross-platform Look & Feel
            }

            try {
                DesktopAuditController controller = new DesktopAuditController();
                CareerPulseDesktopApp frame = new CareerPulseDesktopApp(controller);
                frame.setVisible(true);
            } catch (DatabaseOperationException ex) {
                JOptionPane.showMessageDialog(
                    null,
                    "Unable to initialize JDBC database: " + ex.getMessage(),
                    "CareerPulse Startup Error",
                    JOptionPane.ERROR_MESSAGE
                );
            }
        });
    }
}
