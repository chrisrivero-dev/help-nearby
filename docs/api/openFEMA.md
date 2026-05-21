Skip to main content
U.S. flag

An official website of the United States government
FEMA Logo
Apply for Assistance

                OpenFEMA
                API Documentation
                Data Sets
                Frequently Asked Questions
                Changelog
                Working with Large Datasets
                Developer Resources
                Open Government
                Other FEMA Data Sources
                Terms and Conditions
                Annual Reports
                Data Visualizations
                Disaster Relief Fund Reports
                FEMA Guidance Documents
                Glossary

OpenFEMA API Documentation
world globe

    English

As part of the OpenFEMA initiative, FEMA is providing read-only API based access to datasets (Entities). The data is exposed using a RESTful interface that uses query string parameters to manage the query. Use of the service is free and does not require a subscription or API key.

This document provides information on how to use the API including command examples. The examples shown are HTTP requests. Other methods such as CURL or accessing with a programming language can also be used. See the Developer Resources page for additional information.

A full list of Entities/endpoints supported by the API can be found at Data Sets.

Major and minor version features (including the addition or deprecation of datasets) can be found on the Changelog page.
Basics

The base path for the API endpoints is https://www.fema.gov/api/open.

To use the API, you will need to build a query string path in the following format:

[base path]/[version]/[entity]

    version:  To support future enhancements we are using a versioning system for the APIs. To use the APIs you must indicate which version you need. The API version format is v1, v2, v3, etc.
    entity: This corresponds to the name of the entity set you are requesting. The entity names can be found in the list of released datasets.

Example: https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries
alert - info

Query strings including the data set/endpoint name are case sensitive.

Query strings including the data set/endpoint name are case sensitive.

A successful response will include a both a metadata object (described below) and an array of entity objects (records). By default, only 1,000 records are returned. See the URI commands below for information on how to page through all found records. Working examples can be found on the Developer Resources page.
URI Quick Reference
Command Description Default
$allrecords	BETA. To specify that all records are to be returned when downloading data.	false (only records up to $top returned)
$count To specify if a total entity count should be returned with the query. false (the count is not returned)
$filename	To specify the download filename.	 
$filter To filter or limit the results returned. All records up to $top returned
$format To specify the format of the returned data. JSON
$inlinecount	DEPRECATED. See the $count parameter. To specify if a total entity count should be returned with the query.	none (the count is not returned)
$metadata Controls the presence of the metadata object in data set returns. true (metadata is returned)
$orderby	Sort the returned data.	 
$select To specify the fields to return. All fields returned
$skip	Number of records to skip from the dataset.	0
$top Limit the number of records returned. 1,000 (maximum is 10,000)
URI Commands Reference

A Uniform Resource Identifier (URI) is a string of characters identifying an abstract or physical resource on the web. This can be a URL to a website; it can also be identify a specific resource as well as a location. The following URI commands can be used to alter your request of OpenFEMA endpoint data – filtering the result, specifying a return type, or including additional metadata.
alert - warning

A full download link selected from the dataset page or a file type appended to an endpoint will perform a full download. Adding parameters after the file extension will have no effect. If you want to specify a parameter, even for a full download, do not use the file extension shortcut.

Do not do this:
v1/DeclarationDenials.csv?$orderby=state

Do this instead:
v1/DeclarationDenials?$format=csv&$orderby=state
Search

Performs a search of the entity using specified query string parameters.
Query String Parameters

$allrecords

BETA. This query argument forces all records to be returned as part of a download rather than adhering to the maximum return limit. It is an attempt to reduce the difficulty in downloading large sets of data. Currently, any query resulting in more records than specified by $top will require a "paging" technique to iterate through results to capture all of the data. The $allrecords=true query string overrides this behavior.

Note, this will not have the effect of retrieving and displaying all records within a browser window. It must be used in conjunction with a file download as shown in the following example.
alert - warning

This is being released as a BETA feature. If we find it negatively impacts OpenFEMA system performance, it may be removed.

Valid values are:

    true - Returns all records matching criteria as part of a download
    false - Returns only the number of records matching $top (default)

Example

    /api/open/v2/DisasterDeclarationsSummaries?$format=csv&$filename=DDSV2_all.csv&$allrecords=true - Saves all 65K+ records to the designated file.

$count

Query option that controls if a total count of all entities matching the request MUST be returned as part of the result. If the $count parameter is not supplied, no count will be returned; it will appear as “0”. Note, this parameter is a replacement for the $inlinecount parameter.
alert - info

If retrieving large amounts of data or using complex $filter criteria through a "paging" technique, avoid specifying "$count=true" in each call. This will result in faster queries.

Valid values are:

    true - Returns the count
    false - Does not return the count (default)

Example

    /api/open/v2/DisasterDeclarationsSummaries?$count=true - Returns the record count
    /api/open/v2/DisasterDeclarationsSummaries?$count=false - Returns without the record count (i.e., a record count of 0)
    /api/open/v2/DisasterDeclarationsSummaries - (Default) Returns without the record count (i.e., a record count of 0)

$filename

Allows for the specification of a download filename. The data downloaded will be limited to fields specified using $select (all fields if none specified), will contain records limited by $filter, and will be sorted according to the $orderby parameter. Note, all of the $filter, $orderby, and $select parameters will work with $filename. The filename should not be surrounded by quotation marks even if the filename contains spaces. If no $format parameter is specified, JSON will be the result.

Example

    /api/open/v1/DataSets?$filename=OpenFEMADatasets.txt - Returns data set metadata and initiates a download to a filename called “OpenFEMADatasets.txt”. Even though a “txt” extension has been provided, data will default to a JSON format as no $format parameter was specified.
    /api/open/v1/DataSets?$select=identifier,name&$filter=lastRefresh gt '2020-05-01'&$orderby=name&$filename=DataSetList.json - Returns data set metadata and initiates a download to a filename called “DataSetList.json”. Only dataset identifiers and names will be returned for those that were last refreshed after 05-01-2020 and sorted by name.

$filter

Used to "filter" the results returned. The API provides a number of operations that can be used to build your request. The API provides as subset of the available options in the OData specification. Please note that dates should be represented in an ISO-8601 format.
alert - info

The query parser is very strict. Ensure your spacing, quoting, and capitalization are correct.

Spaces are required between logical operators.

Strings must be single quoted.

URL encoding (e.g., %20, %24, %27, etc.) may be used.

Any string containing a quote (e.g., bob's burgers) must have the quote doubled to have an effect (e.g., bob''s burgers).

Logical Operators:
Operator Description Example
eq Equal /DisasterDeclarationsSummaries?$filter=state eq 'VA'
ne	Not equal	/DisasterDeclarationsSummaries?$filter=state ne 'VA'
gt Greater than /DisasterDeclarationsSummaries?$filter=declarationDate gt '1969-04-18T04:00:00.000z'
ge	Greater than or equal	/DisasterDeclarationsSummaries?$filter=disasterNumber ge 4000
lt Less than /DisasterDeclarationsSummaries?$filter=declarationDate lt '2013-01-01'
le	Less than or equal	/DisasterDeclarationsSummaries?$filter=disasterNumber le 100
and Logical and /DisasterDeclarationsSummaries?$filter=declarationDate ge '2010-01-01T04:00:00.000z' and state eq 'VA'
or	Logical or	/DisasterDeclarationsSummaries?$filter=state eq 'VA' or state eq 'NY'
not Logical negation /DisasterDeclarationsSummaries?$filter=not substringof(declarationTitle,'OO')
in	Logical or for multiple values	Be mindful of the space between the "in" and the parentheses "(":
/DisasterDeclarationsSummaries?$filter=state in ('VA','NY')

Array elements may be searched in a similar fashion and will return records where ANY of the values appear in the array field:
/IpawsArchivedAlerts?$filter=info/category in ('Met','Safety')&$top=3

To apply a logical negation (i.e., not in), the syntax is "not fieldname in (value list)":
/FemaWebDisasterDeclarations?$filter=not stateCode in ('VT','VA')

When combining with other criteria, use the precedence grouping operator to ensure the entire criteria is not logically negated:
/FemaWebDisasterDeclarations?$filter=(not stateCode in ('VT','VA')) and incidentType eq 'Fire'

Grouping Operators:

This represents logical operator grouping, not data aggregation.
Operator Description Example
( ) Precedence grouping /DisasterDeclarationsSummaries?$filter=(state eq 'VA' and designatedArea eq 'Alleghany (County)') or disasterNumber eq 1570

String Functions:

To enable filtering on partial strings.
Function Example
bool substringof(string searchString, string searchInString) /DisasterDeclarationsSummaries?$filter=substringof('OO',declarationTitle)
bool endswith(string string, string suffixString)	/DisasterDeclarationsSummaries?$filter=endswith(declarationTitle,'ING')
bool startswith(string string, string prefixString) /DisasterDeclarationsSummaries?$filter=startswith(declarationTitle,'FLO')

Special Functions:

To permit searching within objects, including geospatial operations.
unction Example
contains Use the string functions for identifying fields that contain a string being sought.
Object example where the value is an array:
/IpawsArchivedAlerts?$filter=contains(info/eventCode/value, 'ADR')&$top=1
/DataSets?$filter=contains(keyword,'Flood')

A bracket and quote syntax works as well as a more simple single quote:
/IpawsArchivedAlerts?$filter=contains(code, ["IPAWSv1.0"])&$top=1
/IpawsArchivedAlerts?$filter=contains(code, 'IPAWSv1.0')&$top=1

Either of these syntaxes will return records where ALL the values appear in the array field:
/IpawsArchivedAlerts?$filter=contains(info/category,('Met','Safety'))&$top=3

/IpawsArchivedAlerts?$filter=contains(('Met','Safety'),info/category)&$top=3
geo.intersects Permits querying against a geospatial enabled dataset. The entity/field/object to be searched is passed along with a bounding polygon or a point. The syntax for the polygon must be in the format of the examples. Note, there is no space between "geography" and the geometry type. Replace the coordinates with your own polygon coordinates in WKT (Well Known Text) format. Examples:
/api/open/v1/IpawsArchivedAlerts?$filter=geo.intersects(searchGeometry, geography'POLYGON((-171.791110603 71.3577635769,-66.96466 71.3577635769,-66.96466 18.91619,-171.791110603 18.91619,-171.791110603 71.3577635769))')&$top=100

/FemaRegions?$filter=geo.intersects(regionGeometry,geography%27POINT(-71.054649%2042.354478)%27)

$format

Controls the format of the returned data.

Supported values include:

    json - Returns data in the JavaScript Object Notation format (default)
    jsona - Returns data as a JavaScript Object Notation array format. There is no top-level object, and each object within the array (a record) is separated by a comma. The metadata object is automatically suppressed if this format is chosen.
    jsonl - Also known as a json lines file. Returns one json object (a record) per line with a line feed as a delimiter. In other words, each line is a valid json object. This is a good format for streaming large amounts of data where a line buffer is specified. The metadata object is automatically suppressed if this format is chosen.
    geojson - Returns data as a JavaScript Object Notation format encoded with geospatial data structures. NOTE: This format will only work if the dataset supports geospatial data such as the FemaRegions dataset.
    csv - Returns data in a Comma-Separated Value format. Metadata is not returned when using CSV format.
    parquet – Returns data as a column-oriented data file. This format is designed for efficient data storage and retrieval and works well with programming constructs in languages like R or Python. Currently, no encoding is applied, and data is compressed with the Snappy format.

Example

    /api/open/v2/DisasterDeclarationsSummaries?$format=json - Data is returned in JSON format
    /api/open/v2/DisasterDeclarationsSummaries?$format=jsona - Data is returned in JSONA format
    /api/open/v2/DisasterDeclarationsSummaries?$format=csv - Data is returned in JSON format
    /api/open/v2/FemaRegions?$format=geojson - Data is returned in a geospatial encoded GEOJSON format
    /api/open/v1/FemaWebDisasterDeclarations?$format=parquet - Data is returned in a column-oriented parquet format

$inlinecount

DEPRECATED. This parameter will remain for several months but is being replaced by $count. This will add clarity to the returned metadata object and is more in-line with OData standards.

Query options that controls if a total count of all entities matching the request MUST be returned as part of the result. Note, if the $inlinecount parameter is not supplied, no count will be returned; it will appear as “0”.
alert - info

If retrieving large amounts of data or using complex $filter criteria through a "paging" technique, avoid specifying "allpages" in each call. This will result in faster queries.

Valid values are:

    allpages - Returns the count
    none - Does not return the count (default)

Example

    /api/open/v2/DisasterDeclarationsSummaries?$inlinecount=allpages - Returns the record count
    /api/open/v2/DisasterDeclarationsSummaries?$inlinecount=none - Returns without the record count (i.e., a record count of 0)
    /api/open/v2/DisasterDeclarationsSummaries - (Default) Returns without the record count (i.e., a record count of 0)

$metadata

Controls the presence of the data set metadata object with a returned data set. Note, only applies if the format is JSON. If the format is CSV, no metadata is returned.

Supported values include:

    true– Returns the metadata object for data returned in a JSON format (default)
    false – Suppresses the metadata object for data returned in a JSON format

Example

    /api/open/v2/DisasterDeclarationsSummaries?$metadata=off - This will cause the metadata object to be suppressed.

$orderby

Allows for the sorting of data on the server. By providing a comma separated list of fields and a sort direction you can control the order that data is returned. Available sort directions are “asc” and “desc” for ascending or descending respectively. If no direction is provided, ascending is the default.

Example

    /api/open/v2/DisasterDeclarationsSummaries?$orderby=state - Sorts data by state in ascending order.
    /api/open/v2/DisasterDeclarationsSummaries?$orderby=state desc, designatedArea - Sorts data by the state field in descending order and by county in ascending order

$select

Used to specify which fields you would like returned in your dataset. Providing a comma separated list of case sensitive field names will return just those fields. If no value is specified, all of the fields are returned.

Example

    /api/open/v2/DisasterDeclarationsSummaries?$select=disasterNumber,state,declarationType - returns only the disasterNumber, state, and declarationType fields.
    /api/open/v2/DisasterDeclarationsSummaries?$select=disasterNumber,state,incidentBeginDate,incidentEndDate - returns only the disasterNumber, state, incidentBeginDate, and incidentEndDate fields.

$skip

Number of records to skip from the dataset. Used in conjunction with $top to allow you to page through the dataset. See the Developer Resources page for working examples of iterating through a result set to capture all the data matching the specified criteria. If no value is specified, $skip defaults to 0 and starts at the beginning of the results set.

Example

    /api/open/v2/DisasterDeclarationsSummaries?$skip=500 - This will return the first 500 records from the query and begin returning results starting with the 501st record
    /api/open/v2/DisasterDeclarationsSummaries?$skip=100 - This will return the first 100 records from the query and begin returning results starting with the 101st record

$top

Limits the number of records returned. Currently the default value is 1,000 records. The maximum value is 10,000 records. See the Developer Resources page for working examples of iterating through a result set to capture all the data matching the specified criteria.

Example

    /api/open/v2/DisasterDeclarationsSummaries?$top=50 - This will return the first 50 records from the query
    /api/open/v2/DisasterDeclarationsSummaries?$top=10 - This will return the first 10 records from the query

Get By ID

Retrieves a specific record identified by its ID field (id).

Query string format is:

/api/open/[version]/[entity]/[_id]

    version:  To support future enhancements we are using a versioning system for the APIs. To use the APIs you must indicate which version you need. The API version format is v1, v2, v3, etc.
    entity: This corresponds to the name of the entity set you are requesting. The entity names can be found in the list of released datasets.
    _id - This is a _id value of a previously identified record in an entity.

Example:

    https://www.fema.gov/api/open/v2/FemaRegions/8a8064df-f1f7-4f0c-a3ae-b31fce82778b

Query String Parameters

$format

Controls the format of the returned data.

Supported values include

    json - Returns data in the JavaScript Object Notation format (default)
    csv - Returns data in a Comma-Separated Value format
    jsona - Returns data as a JavaScript Object Notation array format
    geojson - Returns data as a JavaScript Object Notation format encoded with geographic data structures. NOTE: This format will only work if the dataset supports geospatial data
    parquet – Returns data as a column-oriented data file

Example

    https://www.fema.gov/api/open/v2/FemaRegions/8a8064df-f1f7-4f0c-a3ae-b31fce82778b?$format=json - Data is returned in JSON format
    https://www.fema.gov/api/open/v2/FemaRegions/8a8064df-f1f7-4f0c-a3ae-b31fce82778b?$format=jsona - Data is returned in JSONA format
    https://www.fema.gov/api/open/v2/FemaRegions/8a8064df-f1f7-4f0c-a3ae-b31fce82778b?$format=csv - Data is returned in CSV format

Metadata

A successful response will include a metadata object along with the array of entity objects. Most of the metadata corresponds to the URI commands and parameters specified above. The metadata object can be suppressed by using the $metadata parameter.
Metadata Description
skip Number of records skipped as specified by the $skip parameter. If the $skip parameter was not used, this value will be 0.
top Max number of records returned as specified by the $top parameter. If the $top parameter was not used, this value will be 1,000. The maximum that can be specified is 10,000.
count Count of all possible records found matching any provided criteria. If the $count parameter was not used, or “none” was specified, this value will be 0. If the count returned is greater than the maximum value specified by $top, you will need to implement a paging strategy to return all the records that match the criteria specified.
filter Filter values applied as specified by the $filter parameter.
format Format of the data as specified by the $format parameter. If none specified, the format will default to JSON.
metadata Indicates if the metadata object suppression parameter has been specified.
orderby Sort order for the data as specified by the $orderby parameter.
select Fields specified for return as specified by the $select parameter.
entityname Name of the entity or endpoint for which data was queried.
version The API endpoint version used to return the data.
url The fully composed URL used to return the data.
rundate The date and time when the API call was executed.
DeprecationInformation (optional) An object containing the following 4 metadata items. Only appears when the dataset has been deprecated.
depDate (optional) Only appears when the data set has been deprecated. Indicates that the data set has been deprecated and will be removed by this date.
depApiMessage (optional) Only appears when the data set has been deprecated. Provides additional information about the deprecation of the data set.
depNewURL (optional) Only appears when the data set has been deprecated. Provides a link to an API endpoint that will supersede this dataset (if one exists).
depWebMessage (optional) Only appears when the data set has been deprecated. Provides additional information about the deprecation of the data set as it appears on the dataset webpage.
Special Dataset Fields

As a matter of policy, the OpenFEMA API does not enrich data from source systems. However, up to four fields are added by OpenFEMA either for internal purposes or to aid users in refreshing data. While the fields are briefly described in each dataset data dictionary, confusion about these fields has necessitated a more thorough description.

Datasets internally are classified as RELOAD or UPDATE. RELOAD datasets follow a drop and reload process while UPDATE datasets add new records or update existing records that have changes. Existing records without a change are left unmodified in OpenFEMA. Reloads and updates occur according to the dataset refresh frequency/schedule. Those that are fully reloaded will not contain a hash or lastRefresh value.

id

This is not a unique identifier from the source system. It is an OpenFEMA generated unique identifier assigned to the record that does not persist between dataset refreshes. It can be used as a unique id within the immediate set of downloaded records. However, following the next data refresh, there is no guarantee that the id will remain the same for the for the same record.

Why not use source system identifiers? Some datasets are aggregated, thereby negating the use of a source system id. Some combine data from multiple sources and no one identifier can be used. Some datasets have no available unique identifier. Some source systems consider their identifiers as “sensitive” and are not made available to OpenFEMA.

If you require some kind of source system unique identifier, query the OpenFEMA DataSetFields metadata API and review the primaryKey element to identify those fields contributing to a record's uniqueness. All the fields that have this flag set to true must be used to uniquely identify the record. If none of the dataset fields has the primaryKey value set, the record has no source system identifier available within this dataset. For example, the following query against the Disaster Declarations Summaries dataset will indicate that the declarationNumber in combination with the placeCode will uniquely identify a record: https://www.fema.gov/api/open/v1/DataSetFields?$filter=openFemaDataSet%20eq%20%27DisasterDeclarationsSummaries%27%20and%20datasetVersion%20eq%202%20and%20primaryKey%20eq%20true

hash

An SHA1 hash of the field values of the record. If anything in a record changes—even capitalization, spacing, or punctuation—the SHA1 value will change. OpenFEMA uses this internally to identify changes to records to aid in updates. We have exposed this to the users because someone might find it useful. It should not be used as a record identifier.

lastRefresh

The lastRefresh value in any of the datasets indicates the last date/time the record was added or changed in the OpenFEMA data store from the FEMA source system. It is possible to use this information to query recent data rather than performing a full dataset download. Note that this value does not indicate when the source system data was updated, only when the OpenFEMA record was updated. In addition, datasets that do not contain this field are refreshed by performing a full reload on all the data; there is no way to tell when an individual record was added or updated.

For the DataSets dataset, the lastRefresh value indicates the same – the last date/time the record was added or changed. In this dataset, each record contains the metadata attributes for an individual dataset. Therefore, the lastRefresh value reflects the last date/time the record (i.e., an individual dataset’s metadata) was updated or changed.

Whether you are refreshing the entire dataset or just trying to add or update changed records since the last update, your refresh interval should not be more frequent than the dataset refresh interval. Further, it would be prudent to check the dataset update status prior to executing your own refresh. There may be situations when the OpenFEMA data store is unable to refresh from the source data. See OpenFEMA Guide to Working with Large Data Sets | Appendix B - Checking for Data Updates for a more thorough discussion of using this field to perform updates. See API Tutorial Part 5 Getting Dataset Updates (OpenFEMA GitHub | API Tutorials) for working code examples.

Whether you are refreshing the entire dataset or just trying to add/update changed records since the last update, your refresh interval should not be more frequent than the dataset refresh interval. Further, it would be prudent to check the dataset update status prior to executing your own refresh. There may be situations when the OpenFEMA data store is unable to refresh from the source data.

lastDataSetRefresh

The lastDataSetRefresh value is only found in the DataSets dataset and indicates the last date/time the individual dataset that the record represents was refreshed/reloaded in the OpenFEMA data store from the FEMA source system. Note that this value does not indicate if any records within the individual dataset have been added or changed, only that the dataset refresh/reload process completed. It is possible to use this information to query only recently refreshed datasets rather than performing frequent blind downloads.
OpenAPI Metadata Specification

An API specification defines how an API functions and the results to expect when using the API. Usually, API specifications are associated with documentation. They do more however, providing an understanding of API behavior especially with regard to links with other API’s. Specifications define machine-readable interface files for describing, producing, consuming, and visualizing RESTful web services. Once defined, tools exist to generate documentation, code stubs, and test cases for a given interface.

The “official” OpenFEMA API documentation is available on fema.gov. Additionally, two special endpoints (DataSets and DataSetFields) also exist to provide metadata in a machine-readable format. To enhance the OpenFEMA metadata capabilities, an endpoint has been created to provide an OpenAPI Specification v3.0 file. This format will allow for the experimentation and testing of the OpenFEMA API endpoints directly from a visual interface.

The base path for the OpenAPI metadata endpoint is: https://www.fema.gov/api/open/metadata/v3.0/OpenApi

A file type suffix must be added to the base path. Supported file types are:

    json – returns data in a JSON format
    yaml – returns data in a YAML format

Example

    https://www.fema.gov/api/open/metadata/v3.0/OpenApi.json

DCAT-US Schema v1.1 Metadata Specification

As part of an effort by the United States Government to provide open data to the public, they have required that agencies deliver metadata using the DCAT-US schema. The standard is based on the international W3C DCAT specification and is used by agencies to compile their dataset listings for inclusion on Data.gov. DCAT-US is currently in use by most federal agencies as well as by many state and local governments.

OpenFEMA offers an endpoint to present metadata in the DCAT-US v1.1 schema. The base path for the metadata endpoint is:

https://www.fema.gov/api/open/metadata/DcatUs11

See Also

    API Basics
    DCAT-US Schema v1.1
    OData (Open Data Protocol) Documentation
    OpenFEMA Developer Resources
    OpenAPI Specification v3.0.0 | Introduction, Definitions, & More

Last updated October 3, 2025
Return to top

    Disasters & Assistance
    Grants
    Floods & Maps
    Emergency Management
    About
    Work With Us

FEMA Logo
Facebook
Instagram
Twitter
YouTube
LinkedIn
Newsletter
Contact FEMA
DHS logo
FEMA.gov
An official website of the U.S. Department of Homeland Security

    Accessibility
    Accountability
    Careers
    Civil Rights
    Contact Us
    FOIA
    Glossary
    No FEAR Act
    Plug-Ins
    Privacy
    Report Disaster Fraud
    Website Information
    DHS.gov
    USA.gov
    Inspector General

Download the FEMA App

Get real-time weather and emergency alerts, disaster news, and more with the FEMA app.
Play Store
Download the FEMA App

Get real-time weather and emergency alerts, disaster news, and more with the FEMA app.
App Store
