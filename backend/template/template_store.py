"""
Template Store: Handles template persistence, calibration, multi-template libraries,
and template mismatch detection across general engineering laboratory domains.
"""
import os
import json
from typing import Dict, List, Optional, Tuple
from ..models.schemas import TemplateConfig, AnalysisResult
from .analyzer import TemplateAnalyzer

class TemplateStore:
    def __init__(self, storage_dir: Optional[str] = None):
        if storage_dir is None:
            # Default to templates/saved_templates in project root
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            storage_dir = os.path.join(base_dir, "templates", "saved_templates")
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self._templates: Dict[str, TemplateConfig] = {}
        self._load_built_ins()

    def _load_built_ins(self):
        """Loads reference template and populates multi-subject domain presets."""
        ref_docx = os.path.join(self.storage_dir, "AI_ML_Python_Lab_Record_Reference.docx")
        base_tmpl = None
        if os.path.exists(ref_docx):
            result = TemplateAnalyzer.analyze_docx(ref_docx)
            if result.success and result.template_config:
                base_tmpl = result.template_config

        # Standard multi-subject templates
        presets = [
            ("python_lab_reference", "Python & AI/ML Lab Template", "Artificial Intelligence & Python programming record", "Python / AIML"),
            ("java_lab_template", "Java & OOP Lab Template", "Object-Oriented Programming and Java laboratory record", "Java"),
            ("c_cpp_lab_template", "C / C++ & Data Structures Lab", "Systems programming, C/C++, and Data Structures record", "C / C++"),
            ("dbms_lab_template", "DBMS & SQL Laboratory Template", "Relational database management, SQL queries, and normalization", "DBMS / SQL"),
            ("linux_os_lab_template", "Linux & Operating Systems Lab", "Shell commands, system calls, process scheduling, and OS record", "Linux / OS"),
            ("networks_lab_template", "Computer Networks & IoT Lab", "Network topology, packet simulation, socket programming, and IoT", "Networks"),
            ("web_lab_template", "Web Development Lab Template", "Full-stack HTML, CSS, JavaScript, and Web Technologies record", "Web Dev")
        ]

        for tid, tname, tdesc, tsubj in presets:
            t_obj = base_tmpl.model_copy() if base_tmpl else TemplateConfig()
            t_obj.id = tid
            t_obj.name = tname
            t_obj.description = tdesc
            t_obj.subject = tsubj
            t_obj.font_family = "Times New Roman"
            t_obj.code_font_family = "Times New Roman"
            t_obj.code_font_size = 12
            self.save_template(t_obj)

        # Scan for existing JSON templates
        for fname in os.listdir(self.storage_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(self.storage_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        tmpl = TemplateConfig(**data)
                        self._templates[tmpl.id] = tmpl
                except Exception as e:
                    print(f"Warning: Failed to load template {fname}: {e}")

    def save_template(self, config: TemplateConfig) -> str:
        """Saves a template configuration to disk."""
        self._templates[config.id] = config
        fpath = os.path.join(self.storage_dir, f"{config.id}.json")
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(config.model_dump(), f, indent=2)
        return config.id

    def get_template(self, template_id: str) -> Optional[TemplateConfig]:
        """Retrieves a template by ID."""
        if template_id in self._templates:
            return self._templates[template_id]
        fpath = os.path.join(self.storage_dir, f"{template_id}.json")
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                tmpl = TemplateConfig(**data)
                self._templates[template_id] = tmpl
                return tmpl
        # Fallback to first available template if requested not found
        if self._templates:
            return next(iter(self._templates.values()))
        return TemplateConfig()

    def list_templates(self) -> List[TemplateConfig]:
        """Lists all stored templates."""
        return list(self._templates.values())

    def detect_mismatch(self, candidate_config: TemplateConfig, reference_template_id: str) -> Tuple[bool, List[str]]:
        """
        Detects if an uploaded document's structure differs significantly from a selected template.
        Returns: (has_mismatch, reasons_list)
        """
        ref = self.get_template(reference_template_id)
        if not ref:
            return False, []

        mismatches = []
        # Check margins
        m1, m2 = candidate_config.margins, ref.margins
        if abs(m1.top - m2.top) > 0.25 or abs(m1.left - m2.left) > 0.25:
            mismatches.append(f"Margins differ: Uploaded has ({m1.top}\", {m1.left}\") vs Template ({m2.top}\", {m2.left}\")")

        # Check page borders
        if candidate_config.has_page_border != ref.has_page_border:
            mismatches.append("Page border setting mismatch (one has borders, the other does not)")

        # Check evaluation table
        if bool(candidate_config.evaluation_table_xml) != bool(ref.evaluation_table_xml):
            mismatches.append("Evaluation table presence mismatch")

        # Check header table
        if bool(candidate_config.header_table_xml) != bool(ref.header_table_xml):
            mismatches.append("Experiment header table presence mismatch")

        return len(mismatches) > 0, mismatches
