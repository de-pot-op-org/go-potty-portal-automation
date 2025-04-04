# How To: Manually Create Locations

Owner: Brian Manuputty

<aside>
🚨

**Use the script in the go-potty-portal-firebase repo.**

The script can be found here `functions/src/scripts/create_locations.ts`. Example input data can be found in the `scripts/example_data` folder.

</aside>

1. Before continuing make sure you know and have ready:
    - [ ]  Your User ID
    - [ ]  Organisation ID
    - [ ]  The location type (one of allowed location types per parent organisation)
    - [ ]  Location name
    - [ ]  Location address (optional, but desired)
2. Update the following JSON to fit the new location details.
    - [ ]  Fill in any `address_` details if known, otherwise leave the fields there, but empty.
    - [ ]  Update the timestamp to today at `created_at`, the date is on the left part.
    - [ ]  Fill in your own ID at `created_by`.
    - [ ]  Fill in the location type at `location_type`.
    - [ ]  Fill in the name at `name`.
    - [ ]  Fill in the organisation id at `organisation_id`.
    - [ ]  Update the timestamp to today at `updated_at`, the date is on the left part.
    - [ ]  Fill in your own ID at `updated_by`.
    
    ```json
    {
      "address_city": "The Hague",
      "address_country": "Netherlands",
      "address_line1": "Saturnusstraat 14",
      "address_line2": "Vierde verdieping",
      "address_postal_code": "2516AH",
      "address_region": "Zuid-Holland",
      "created_at": {
        "__time__": "2024-06-16T16:26:48.795Z"
      },
      "created_by": "QkfQFGJNQTZIcN3irS9JXfYWeAM2",
      "location_type": "childcare",
      "name": "Kantoorzz",
      "organisation_id": "nVZGd1IqL7gQgzpOYTWN",
      "updated_at": {
        "__time__": "2024-07-02T10:42:17.292Z"
      },
      "updated_by": "QkfQFGJNQTZIcN3irS9JXfYWeAM2"
    }
    ```
    
3. Create new document in the `locations` collection.
    
    ![CleanShot 2024-09-04 at 19.34.31@2x.png](How%20To%20Manually%20Create%20Locations%20c208ea7638df47beaa8fc336c8c09f49/CleanShot_2024-09-04_at_19.34.312x.png)
    
4. Keep the prefilled ID and fetch the document. Then click the *Edit Document as JSON*.
    
    ![Untitled](How%20To%20Manually%20Create%20Locations%20c208ea7638df47beaa8fc336c8c09f49/Untitled.png)
    
5. Paste in the JSON you edited earlier and press save.
    
    ![CleanShot 2024-09-04 at 19.36.21@2x.png](How%20To%20Manually%20Create%20Locations%20c208ea7638df47beaa8fc336c8c09f49/CleanShot_2024-09-04_at_19.36.212x.png)