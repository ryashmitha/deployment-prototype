---
inclusion: always
---

# SAIL Syntax Reference

Quick syntax patterns for LLM code generation. For detailed best practices and error prevention, see Aurora's SAIL_CODING_GUIDE.md (via MCP).

## Core Syntax Patterns

### Function Calls with Named Parameters
```sail
a!componentName(
  parameter1: value1,
  parameter2: value2,
  parameter3: {item1, item2}
)
```

### Local Variables Wrapper
```sail
a!localVariables(
  local!variableName: value,
  local!anotherVar: {list, of, items},
  /* Expression body - all interface code goes here */
  a!componentName(...)
)
```

### Data Structures

**Lists (Arrays):**
```sail
{item1, item2, item3}
{"string1", "string2"}
{1, 2, 3, 4}
```

**Maps (Dictionaries):**
```sail
a!map(
  key1: "value1",
  key2: 123,
  key3: {nested, list}
)
```

**Accessing Map Values:**
```sail
fv!row.propertyName
local!data.fieldName
```

### Conditional Logic
```sail
if(condition, valueIfTrue, valueIfFalse)

/* Nested conditions */
if(
  condition1,
  result1,
  if(condition2, result2, defaultResult)
)
```

### Logical Operators
```sail
and(condition1, condition2, condition3)
or(condition1, condition2, condition3)
not(condition)

/* Example */
showWhen: and(
  a!isNotNullOrEmpty(local!value),
  local!isEditable
)
```

### Null Checking
```sail
a!isNullOrEmpty(value)
a!isNotNullOrEmpty(value)
a!defaultValue(value, defaultValue)
```

### Common Domains
- `a!` - Appian components and functions
- `fn!` - Built-in functions
- `ri!` - Rule inputs
- `fv!` - Function variables (loop context)

### String Literals
- Use double quotes: `"text here"`
- Line breaks: `char(10)`
- No need for `text()` function on string literals

### Comments
```sail
/* Single or multi-line comment */
```

## Essential Layout Patterns

### Header Content Layout
```sail
a!headerContentLayout(
  header: {},
  contents: {},
  backgroundColor: "#FAFAFC"
)
```

### Columns Layout
```sail
a!columnsLayout(
  columns: {
    a!columnLayout(
      contents: {},
      width: "NARROW"  /* NARROW, MEDIUM, WIDE, AUTO */
    ),
    a!columnLayout(
      contents: {}
    )
  }
)
```

### Card Layout
```sail
a!cardLayout(
  contents: {},
  shape: "SEMI_ROUNDED",
  style: "#FCFCFF",
  borderColor: "#EDEEFA"
)
```

### Card Group Layout
```sail
a!cardGroupLayout(
  cards: {
    a!cardLayout(contents: {}),
    a!cardLayout(contents: {})
  },
  cardWidth: "NARROW"  /* NARROW, MEDIUM, WIDE */
)
```

### Section Layout
```sail
a!sectionLayout(
  label: "Section Title",
  labelSize: "SMALL",
  labelHeadingTag: "H2",
  contents: {}
)
```

### Side by Side Layout
```sail
a!sideBySideLayout(
  items: {
    a!sideBySideItem(
      item: /* single component */,
      width: "MINIMIZE"  /* AUTO, MINIMIZE, 1X-10X */
    ),
    a!sideBySideItem(
      item: /* single component */
    )
  },
  alignVertical: "MIDDLE"
)
```

## Common Display Components

### Rich Text Display
```sail
a!richTextDisplayField(
  labelPosition: "COLLAPSED",
  value: {
    a!richTextItem(
      text: "Text",
      size: "LARGE",
      style: "STRONG",
      color: "ACCENT"
    )
  }
)
```

### Grid Field
```sail
a!gridField(
  labelPosition: "COLLAPSED",
  data: local!dataList,
  columns: {
    a!gridColumn(
      label: "Column Name",
      value: fv!row.fieldName
    )
  },
  borderStyle: "LIGHT",
  shadeAlternateRows: true
)
```

### Tag Field
```sail
a!tagField(
  labelPosition: "COLLAPSED",
  tags: {
    a!tagItem(
      text: "Status",
      backgroundColor: "POSITIVE"
    )
  },
  size: "SMALL"
)
```

### Progress Bar
```sail
a!progressBarField(
  labelPosition: "COLLAPSED",
  percentage: 75,
  color: "ACCENT",
  style: "THIN"
)
```

## Common Input Components

### Text Field
```sail
a!textField(
  label: "Label",
  labelPosition: "ABOVE",
  value: local!variable,
  saveInto: local!variable,
  required: true
)
```

### Dropdown Field
```sail
a!dropdownField(
  label: "Label",
  labelPosition: "ABOVE",
  choiceLabels: {"Option 1", "Option 2"},
  choiceValues: {1, 2},
  value: local!selection,
  saveInto: local!selection,
  placeholder: "Select an option"
)
```

### Date Field
```sail
a!dateField(
  label: "Date",
  labelPosition: "ABOVE",
  value: local!date,
  saveInto: local!date
)
```

## Action Components

### Button Array Layout
```sail
a!buttonArrayLayout(
  buttons: {
    a!buttonWidget(
      label: "Submit",
      style: "SOLID",
      saveInto: {}
    )
  },
  align: "END"
)
```

### Links in Rich Text
```sail
a!richTextDisplayField(
  labelPosition: "COLLAPSED",
  value: {
    a!richTextItem(
      text: "Click here",
      link: a!dynamicLink(saveInto: {}),
      linkStyle: "STANDALONE"
    )
  }
)
```

## Chart Components

### Line Chart
```sail
a!lineChartField(
  labelPosition: "COLLAPSED",
  categories: {"Mon", "Tue", "Wed"},
  series: {
    a!chartSeries(
      label: "Series",
      data: {10, 20, 15}
    )
  },
  colorScheme: "OCEAN",
  height: "MEDIUM"
)
```

### Pie Chart
```sail
a!pieChartField(
  labelPosition: "COLLAPSED",
  series: {
    a!chartSeries(label: "Item 1", data: 30),
    a!chartSeries(label: "Item 2", data: 70)
  },
  colorScheme: "OCEAN",
  style: "DONUT",
  seriesLabelStyle: "LEGEND"
)
```

### Column Chart
```sail
a!columnChartField(
  labelPosition: "COLLAPSED",
  categories: {"Q1", "Q2", "Q3"},
  series: {
    a!chartSeries(
      label: "Sales",
      data: {45000, 52000, 48000}
    )
  },
  colorScheme: "OCEAN"
)
```

## Key Syntax Rules

1. **All components start with `a!`**
2. **Named parameters use colons**: `parameter: value`
3. **Lists use curly braces**: `{item1, item2}`
4. **Strings use double quotes**: `"text"`
5. **No semicolons** - comma-separated
6. **Case-sensitive** - exact parameter names
7. **Wrap interfaces in `a!localVariables()`** when using local variables
8. **Use `fv!row` to access grid row data**
9. **Use logical functions**: `and()`, `or()`, `not()`
10. **Check nulls**: `a!isNullOrEmpty()`, `a!isNotNullOrEmpty()`

## Common Parameter Values

**Label Positions:** `"ABOVE"`, `"COLLAPSED"`, `"JUSTIFIED"`, `"ADJACENT"`

**Sizes:** `"SMALL"`, `"STANDARD"`, `"MEDIUM"`, `"LARGE"`

**Colors:** `"ACCENT"`, `"POSITIVE"`, `"NEGATIVE"`, `"SECONDARY"`, or hex values

**Button Styles:** `"SOLID"`, `"OUTLINE"`, `"LINK"`

**Card Shapes:** `"ROUNDED"`, `"SEMI_ROUNDED"`, `"SQUARED"`

**Column Widths:** `"NARROW"`, `"MEDIUM"`, `"WIDE"`, `"AUTO"`

**Side by Side Widths:** `"AUTO"`, `"MINIMIZE"`, `"1X"` through `"10X"`

---

**Note:** This is a quick syntax reference for code generation. For comprehensive guidance including error prevention, best practices, and detailed examples, refer to Aurora's SAIL_CODING_GUIDE.md via the MCP server.
