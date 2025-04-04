# How To: Manually Create Organisations

Owner: Brian Manuputty

<aside>
🚨

**Use the script in the go-potty-portal-firebase repo.**

The script can be found here `functions/src/scripts/create_organisation.ts`. Example input data can be found in the `scripts/example_data` folder.

</aside>

<aside>
🚨

**Remember to add the organisation to the OrganisationEntity enum in the portal codebase.**

</aside>

**MANUAL WAY…**

1. Update the following JSON to fit the new organisation details.

- Fill in the address if known, otherwise leave the fields empty.
- Leave location type as default unless you know this organisation has their own custom location types.
    - If an organisation has custom location types, communicate with developers which ones they are and how to put them in here.
- Fill in the name and timestamps.
- Fill in your own ID at created_by and updated_by.
    - Nayden - 0m6kYPPx9eZz0SGfTRD2Op8zkmo1
    - Femke - 5mgNyFdLMXMI29GywvrQ8Z4f9ms1
    - Seth - 6kOB3lYQlqeD8WHlANXcUVc2Z7v1
    - Brian - QkfQFGJNQTZIcN3irS9JXfYWeAM2
    - Elianne - jCA5H68tuagLpCH0r5Nexe7kpIc2

```json
{
  "address_city": "The Hague",
  "address_country": "Netherlands",
  "address_line1": "Saturnusstraat 14",
  "address_line2": "",
  "address_postal_code": "2516 AH",
  "address_region": "Zuid-Holland",
  "created_at": {
    "__time__": "2024-06-29T21:38:24.033999Z"
  },
  "created_by": "QkfQFGJNQTZIcN3irS9JXfYWeAM2",
  "location_types": [
    "location"
  ],
  "name": "De Pot Op Nu",
  "updated_at": {
    "__time__": "2024-06-29T21:38:36.591Z"
  },
  "updated_by": "QkfQFGJNQTZIcN3irS9JXfYWeAM2"
}
```

1. Create new document in the `organisations` collection.
    
    ![Untitled](How%20To%20Manually%20Create%20Organisations%20c6eadc89e53c4b65907da4b911723364/Untitled.png)
    
2. Keep the prefilled ID and fetch the document. Then click the *Edit Document as JSON*.
    
    ![Untitled](How%20To%20Manually%20Create%20Organisations%20c6eadc89e53c4b65907da4b911723364/Untitled%201.png)
    
3. Paste in the JSON you edited earlier and press save.
    
    ![Untitled](How%20To%20Manually%20Create%20Organisations%20c6eadc89e53c4b65907da4b911723364/Untitled%202.png)