from pathlib import Path
import re

p = Path("/Users/semi/Vibecode/SingaporeHomeCooks/packages/shc-utils/src/cook-onboarding.ts")
t = p.read_text()
if "onboardingLeadSlotToTimeSlots" not in t:
    marker = "export function buildCookOnboardingFirstListingPayload("
    idx = t.index(marker)
    end = t.index("export function collectCookOnboardingDishes", idx)
    new_fn = Path("/workspace/shc-fix/cook-onboarding-helpers.snippet.ts").read_text()
    p.write_text(t[:idx] + new_fn + t[end:])
    print("patched cook-onboarding.ts")
else:
    print("helpers already present")

tp = Path("/Users/semi/Vibecode/SingaporeHomeCooks/packages/shc-utils/src/cook-onboarding.test.ts")
tt = tp.read_text()
if "onboardingLeadSlotToTimeSlots" not in tt:
    m = re.search(r"import \{([^}]+)\} from '\./cook-onboarding';", tt)
    if m and "onboardingLeadSlotToTimeSlots" not in m.group(1):
        tt = tt.replace(m.group(0), "import {" + m.group(1).rstrip() + ",\n  onboardingLeadSlotToTimeSlots,\n  cookOnboardingDishFromWizardFields,\n} from './cook-onboarding';")
    tt += Path("/workspace/shc-fix/cook-onboarding-helpers.test.snippet.ts").read_text()
    tp.write_text(tt)
    print("tests updated")
else:
    print("tests ok")
