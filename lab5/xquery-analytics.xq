xquery version "1.0";

(: Общий документ :) 
declare variable $doc := doc("data.xml")/universityResearch;

element task1-sorted-by-funding {
  for $p in $doc/projects/project
  let $total := sum($p/funding/grant/xs:decimal(@amount))
  order by $total descending, $p/title
  return element project {
    attribute id { $p/@id },
    attribute title { $p/title/string() },
    attribute totalFunding { $total },
    attribute currency { ($p/funding/grant/@currency)[1] }
  }
};

element task2-publication-counts {
  for $p in $doc/projects/project
  group by $pid := $p/@id
  let $title := $p[1]/title/string()
  let $count := count($p/publications/publication)
  order by $count descending, $title
  return element project {
    attribute id { $pid },
    attribute title { $title },
    attribute publications { $count }
  }
};

element task3-report {
  element report {
    attribute generated { current-date() },
    element projects {
      for $p in $doc/projects/project
      let $funding := sum($p/funding/grant/xs:decimal(@amount))
      let $pubs := count($p/publications/publication)
      let $participants := count($p/participants/participant)
      let $datasets := for $dref in $p/datasets/datasetRef
        let $d := $doc/datasetsCatalog/dataset[@id = $dref/@ref]
        return element dataset {
          attribute id { $d/@id },
          attribute title { $d/title/string() },
          attribute sizeGB { $d/sizeGB/string() },
          attribute usage { $dref/@usage }
        }
      return element project {
        attribute id { $p/@id },
        attribute title { $p/title/string() },
        attribute status { $p/@status },
        element funding { attribute total { $funding } },
        element publications { attribute count { $pubs } },
        element participants { attribute count { $participants } },
        element datasets { $datasets }
      }
    },
    element multiProjectResearchers {
      for $r in $doc/researchers/researcher
      let $projectCount := count($doc/projects/project/participants/participant[@researcherRef = $r/@id])
      where $projectCount > 1
      order by $projectCount descending, $r/name/string()
      return element researcher {
        attribute id { $r/@id },
        attribute name { $r/name/string() },
        attribute projects { $projectCount }
      }
    }
  }
};
