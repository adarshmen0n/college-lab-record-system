"""
Page Pairing Manager: Controls facing-page spreads for lab records, ensuring
Output is always placed on Left-side facing print pages and Experiment details
on Right-side print pages.
"""
from typing import List, Dict, Any

class PagePairingManager:
    @staticmethod
    def classify_page_sides(total_pages: int, start_page_number: int = 1) -> List[Dict[str, Any]]:
        """
        Classifies each page as 'RIGHT' (Odd) or 'LEFT' (Even) in a standard bound notebook.
        Page 1 = RIGHT
        Page 2 = LEFT
        Page 3 = RIGHT (faces Page 2)
        Page 4 = LEFT (faces Page 5)
        """
        pages = []
        for i in range(total_pages):
            p_num = start_page_number + i
            side = "RIGHT" if p_num % 2 == 1 else "LEFT"
            pages.append({
                "page_index": i,
                "page_number": p_num,
                "side": side
            })
        return pages
